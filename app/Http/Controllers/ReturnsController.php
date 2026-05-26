<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Services\ActivityLogger;
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
            'quantity_returned' => 'required|integer|min:1',
            'refund_method' => 'required|in:cash,card,store_credit,exchange',
            'reason' => 'required|in:defective,wrong_item,not_satisfied,other',
            'notes' => 'nullable|string',
        ]);

        $saleItem = $sale->items()->findOrFail($validated['sale_item_id']);

        // Vérifier que la quantité retournée ne dépasse pas la quantité vendue
        $alreadyReturned = $saleItem->returns->sum('quantity_returned');
        if ($alreadyReturned + $validated['quantity_returned'] > $saleItem->quantity) {
            return back()->withErrors([
                'quantity_returned' => "La quantité retournée ne peut pas dépasser la quantité vendue. "
                    . "Déjà retourné: {$alreadyReturned}, disponible: " . ($saleItem->quantity - $alreadyReturned)
            ])->withInput();
        }

        $refundAmount = (float)$saleItem->unit_price * $validated['quantity_returned'];

        $return = DB::transaction(function () use ($sale, $saleItem, $user, $validated, $refundAmount) {
            $return = SaleReturn::create([
                'sale_id' => $sale->id,
                'sale_item_id' => $saleItem->id,
                'user_id' => $user->id,
                'quantity_returned' => $validated['quantity_returned'],
                'refund_amount' => $refundAmount,
                'refund_method' => $validated['refund_method'],
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Recalculer les montants de la vente après retour
            $this->recalculateSaleAmounts($sale);

            return $return;
        });

        ActivityLogger::created($return, "Retour enregistré pour {$saleItem->product_name} (Qté: {$validated['quantity_returned']})");

        return back()->with('success', "Retour enregistré. Remboursement de " . number_format($refundAmount, 0, ',', ' ') . " FCFA");
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

        DB::transaction(function () use ($return, $sale, $saleItem, $refundAmount) {
            // Restaurer le stock
            if ($saleItem->product && $saleItem->product->track_stock) {
                $saleItem->product->decrement('stock_quantity', $return->quantity_returned);
            }

            // Recalculer les montants de la vente après annulation du retour
            $sale->returns()->where('id', '!=', $return->id)->get();
            $this->recalculateSaleAmounts($sale);

            // Supprimer le retour
            $return->delete();
        });

        ActivityLogger::deleted($return, "Retour annulé pour {$saleItem->product_name}");

        return back()->with('success', 'Retour annulé et stock restauré.');
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
     * Impacte: subtotal, tax_amount, discount_amount, total, remaining_amount, status
     */
    private function recalculateSaleAmounts(Sale $sale): void
    {
        // Recalculer le subtotal à partir des items non retournés
        $subtotal = 0;
        $totalRefunded = 0;

        foreach ($sale->items as $item) {
            $qtyNotReturned = $item->quantity - $item->returns->sum('quantity_returned');
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

        // Déterminer le nouveau statut
        $allItemsReturned = $sale->items->every(function ($item) {
            return $item->returns->sum('quantity_returned') >= $item->quantity;
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
            'status' => $newStatus,
        ]);

        // Marquer les articles retournés
        foreach ($sale->items as $item) {
            $totalReturned = $item->returns->sum('quantity_returned');
            $item->update(['is_returned' => $totalReturned >= $item->quantity]);
        }
    }
