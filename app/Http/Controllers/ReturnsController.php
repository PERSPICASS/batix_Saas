<?php

namespace App\Http\Controllers;

use App\Support\Unit;
use App\Rules\QuantityForProduct;
use App\Models\ReturnedInventory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Services\ActivityLogger;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReturnsController extends Controller
{
    public function store(Request $request, string $code_user, Sale $sale)
    {
        $user = Auth::user();
        if (!$user->accessibleShopsQuery()->where('id', $sale->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'sale_item_id' => 'required|exists:sale_items,id',
            'quantity_returned' => ['required', 'numeric', 'gt:0', new QuantityForProduct],
            'refund_method' => 'required|in:cash,card,store_credit,exchange',
            'reason' => 'required|in:defective,wrong_item,not_satisfied,other',
            'notes' => 'nullable|string',
        ]);

        $saleItem = $sale->items()->findOrFail($validated['sale_item_id']);

        // Vérifier que la quantité retournée ne dépasse pas la quantité vendue
        $alreadyReturned = Unit::round($saleItem->returns->sum('quantity_returned'));
        if (Unit::round($alreadyReturned + $validated['quantity_returned']) > $saleItem->quantity) {
            return back()->withErrors([
                'quantity_returned' => "La quantité retournée ne peut pas dépasser la quantité vendue. "
                    . "Déjà retourné: {$alreadyReturned}, disponible: " . Unit::round($saleItem->quantity - $alreadyReturned)
            ])->withInput();
        }

        [$return, $refundAmount] = DB::transaction(function () use ($sale, $saleItem, $user, $validated) {
            $totalBefore = (float) $sale->total;

            $return = SaleReturn::create([
                'sale_id' => $sale->id,
                'sale_item_id' => $saleItem->id,
                'user_id' => $user->id,
                'quantity_returned' => $validated['quantity_returned'],
                'refund_amount' => 0,
                'refund_method' => $validated['refund_method'],
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Recharger la vente avec les relations mises à jour
            $sale->refresh();
            $sale->load('items.returns');

            // Le recalcul réduit la remise au prorata : on garde celle accordée au comptoir,
            // tant qu'elle est encore intacte, c'est-à-dire au tout premier retour.
            if ($sale->original_discount_amount === null && $sale->returns()->count() === 1) {
                $sale->update(['original_discount_amount' => $sale->discount_amount]);
            }

            // Recalculer les montants de la vente après retour
            $this->recalculateSaleAmounts($sale);

            // On rembourse exactement ce dont le total a baissé, TVA et remise comprises.
            // C'était prix unitaire × quantité : sur une vente à 18 % de TVA le client
            // récupérait moins qu'il n'avait payé, avec une remise la boutique rendait trop.
            $refundAmount = round($totalBefore - (float) $sale->total, 2);
            $return->update(['refund_amount' => $refundAmount]);

            return [$return, $refundAmount];
        });

        ActivityLogger::message('create', 'return_created', [
            'product' => $saleItem->product_name,
            'qty' => $validated['quantity_returned'],
        ], $return);

        // Recharger la vente avec les items et retours mis à jour pour la réponse
        $sale = $sale->fresh(['items.returns', 'items.product', 'customer']);

        return response()->json([
            'success' => true,
            'refund_amount' => $refundAmount,
            'message' => "Retour enregistré. Remboursement de " . number_format($refundAmount, 0, ',', ' ') . " FCFA",
            'sale' => [
                'id' => $sale->id,
                'ticket_number' => $sale->ticket_number,
                'sale_date' => $sale->sale_date,
                'payment_method' => $sale->payment_method,
                'status' => $sale->status,
                'subtotal' => $sale->subtotal,
                'tax_amount' => $sale->tax_amount,
                'discount_amount' => $sale->discount_amount,
                'original_discount_amount' => $sale->original_discount_amount,
                'total' => $sale->total,
                'amount_paid' => $sale->amount_paid,
                'change_amount' => $sale->change_amount,
                'remaining_amount' => $sale->remaining_amount,
                'credit_due_date' => $sale->credit_due_date,
                'notes' => $sale->notes,
                'shop' => $sale->shop,
                'user' => $sale->user,
                'customer' => $sale->customer,
                'items' => $sale->items->map(function($item) {
                    return [
                        'id' => $item->id,
                        'product_name' => $item->product_name,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'tax_rate' => $item->tax_rate,
                        'tax_amount' => $item->tax_amount,
                        'total' => $item->total,
                        'product' => $item->product,
                        'returns' => $item->returns,
                    ];
                })->all(),
            ],
        ]);
    }

    public function destroy(string $code_user, SaleReturn $return)
    {
        $user = Auth::user();
        $sale = $return->sale;

        if (!$user->accessibleShopsQuery()->where('id', $sale->shop_id)->exists()) {
            abort(403);
        }

        if (!in_array($user->role, ['super_admin', 'manager'])) {
            return back()->with('error', 'Seul un administrateur peut annuler un retour.');
        }

        $saleItem = $return->saleItem;
        $refundAmount = $return->refund_amount;

        $wasApproved = DB::transaction(function () use ($return, $sale, $saleItem) {
            // Un retour client ne touche le stock qu'à l'approbation (voir
            // ReturnedInventoryController::approve) : tant qu'il est encore "pending"
            // (ou a été rejeté), aucune unité n'a été recréditée au stock. Ne re-déduire
            // le stock à l'annulation que si l'entrée avait bien été approuvée — sinon on
            // fait dériver le stock vers le négatif pour des unités jamais restaurées.
            $returnedInventory = ReturnedInventory::where('sale_return_id', $return->id)
                ->lockForUpdate()
                ->first();
            $wasApproved = $returnedInventory?->status === 'approved';

            if ($wasApproved && $saleItem->product) {
                StockMovementService::recordReturnCancellation(
                    $saleItem->product,
                    $return->quantity_returned,
                    $sale->shop_id,
                    $return->sale
                );
            }

            // Supprimer le retour (cascade sur l'entrée returned_inventories associée)
            $return->delete();

            // Recharger la vente avec les relations mises à jour
            $sale->refresh();
            $sale->load('items.returns');

            // Recalculer les montants de la vente après annulation du retour
            $this->recalculateSaleAmounts($sale);

            return $wasApproved;
        });

        ActivityLogger::message('delete', 'return_cancelled', ['product' => $saleItem->product_name], $return);

        return back()->with('success', $wasApproved
            ? 'Retour annulé et stock restauré.'
            : 'Retour annulé.');
    }

    public function listBySale(string $code_user, Sale $sale)
    {
        $user = Auth::user();
        if (!$user->accessibleShopsQuery()->where('id', $sale->shop_id)->exists()) {
            abort(403);
        }

        $returns = $sale->returns()->with(['saleItem', 'user'])->get()->map(function ($return) {
            return [
                'id' => $return->id,
                'product_name' => $return->saleItem->product_name,
                'quantity_returned' => $return->quantity_returned,
                'refund_amount' => $return->refund_amount,
                'refund_method' => $return->refund_method,
                'reason' => $return->reason,
                'notes' => $return->notes,
                'return_date' => $return->return_date->format('d/m/Y H:i'),
                'user_name' => $return->user->name,
            ];
        });

        return response()->json($returns);
    }

    /**
     * Recalcule tous les montants d'une vente après des retours.
     * Impacte: subtotal, tax_amount, discount_amount, total, remaining_amount, change_amount, status
     */
    private function recalculateSaleAmounts(Sale $sale): void
    {
        // Recalculer le subtotal à partir des items non retournés
        $subtotal = 0;
        $totalRefunded = 0;

        foreach ($sale->items as $item) {
            $qtyNotReturned = Unit::round($item->quantity - $item->returns->sum('quantity_returned'));
            $subtotal += $item->unit_price * $qtyNotReturned;
            $totalRefunded += $item->returns->sum('refund_amount');
        }

        // Recalculer la taxe proportionnellement
        $originalSubtotal = $sale->subtotal ?? 0;
        $taxRate = $originalSubtotal > 0 ? ($sale->tax_amount ?? 0) / $originalSubtotal : 0;
        $newTaxAmount = $subtotal * $taxRate;

        // Recalculer la réduction proportionnellement
        $discountRate = $originalSubtotal > 0 ? ($sale->discount_amount ?? 0) / $originalSubtotal : 0;
        $newDiscountAmount = $subtotal * $discountRate;

        // Nouveau total = subtotal + taxes - réductions
        $newTotal = max(0, $subtotal + $newTaxAmount - $newDiscountAmount);

        // Montant restant à payer = nouveau total - déjà payé
        $amountPaid = $sale->amount_paid ?? 0;
        $newRemaining = max(0, $newTotal - $amountPaid);

        // La monnaie suit le total, comme à la vente (Sale::calculateTotals) : elle restait
        // figée à sa valeur d'origine, sur la page de la vente comme sur le ticket.
        $newChange = max(0, $amountPaid - $newTotal);

        // Déterminer le nouveau statut
        $allItemsReturned = $sale->items->every(function ($item) {
            return Unit::round($item->returns->sum('quantity_returned')) >= $item->quantity;
        });

        $newStatus = match (true) {
            $allItemsReturned => 'returned',
            $newRemaining <= 0 => 'completed',
            default => 'pending',
        };

        // Mettre à jour la vente
        $sale->update([
            'subtotal' => $subtotal,
            'tax_amount' => $newTaxAmount,
            'discount_amount' => $newDiscountAmount,
            'total' => $newTotal,
            'remaining_amount' => $newRemaining,
            'change_amount' => $newChange,
            'status' => $newStatus,
        ]);

        // Marquer les articles retournés (bypass model events pour éviter de réappeler calculateTotals)
        foreach ($sale->items as $item) {
            $totalReturned = Unit::round($item->returns->sum('quantity_returned'));
            DB::table('sale_items')
                ->where('id', $item->id)
                ->update(['is_returned' => $totalReturned >= $item->quantity]);
        }
    }
}
