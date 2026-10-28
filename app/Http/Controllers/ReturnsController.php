<?php

namespace App\Http\Controllers;

use App\Support\Unit;
use App\Rules\QuantityForProduct;
use App\Models\ReturnedInventory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Services\ActivityLogger;
use App\Services\SaleReturnService;
use App\Services\StockMovementService;
use App\Models\CustomerCredit;
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

        // « Échange » se fait désormais par le bouton Échanger, qui enregistre la nouvelle
        // vente dans le même geste ; ici ce ne serait qu'une étiquette sans effet.
        if ($validated['refund_method'] === 'exchange') {
            return back()->withErrors(['refund_method' => "Pour un échange, utilisez le bouton « Échanger » de la vente."]);
        }

        // Un avoir s'attache à un client : sur une vente sans client, il serait perdu.
        if ($validated['refund_method'] === 'store_credit' && !$sale->customer_id) {
            return back()->withErrors(['refund_method' => "Cette vente n'a pas de client : l'avoir ne pourrait être retrouvé. Remboursez en espèces, ou faites un échange."]);
        }

        [$return, $refundAmount] = DB::transaction(function () use ($sale, $saleItem, $user, $validated) {
            [$return, $refundAmount, $owedBack] = SaleReturnService::record(
                $sale, $saleItem, (float) $validated['quantity_returned'], $validated['refund_method'],
                $validated['reason'], $validated['notes'] ?? null, $user
            );

            // Remboursé en avoir : ce que la boutique doit rendre reste chez elle, au crédit
            // du client. La monnaie « à rendre » de la vente n'est alors plus due en espèces.
            if ($validated['refund_method'] === 'store_credit' && $owedBack > 0) {
                CustomerCredit::create([
                    'shop_id' => $sale->shop_id, 'customer_id' => $sale->customer_id, 'user_id' => $user->id,
                    'sale_id' => $sale->id, 'sale_return_id' => $return->id, 'amount' => $owedBack, 'type' => 'return',
                    'notes' => "Retour sur la vente {$sale->ticket_number}",
                ]);
                $sale->update([
                    'store_credit_kept' => round((float) $sale->store_credit_kept + $owedBack, 2),
                    'change_amount' => max(0, round((float) $sale->change_amount - $owedBack, 2)),
                ]);
            }

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

        // Le retour d'un échange a payé la vente de remplacement : l'annuler seul laisserait
        // cette vente réglée par un avoir qui n'existe plus.
        if ($return->replacement_sale_id) {
            return back()->with('error', "Ce retour fait partie d'un échange : il ne peut pas être annulé seul. Faites un retour sur la vente de remplacement si besoin.");
        }

        // Remboursé en avoir : on le reprend, à condition que le client ne l'ait pas dépensé.
        $credit = CustomerCredit::where('sale_return_id', $return->id)->where('type', 'return')->first();
        if ($credit && $credit->customer->creditBalance() < (float) $credit->amount) {
            return back()->with('error', "Le client a déjà dépensé l'avoir de ce retour : il ne peut plus être annulé.");
        }

        $wasApproved = DB::transaction(function () use ($return, $sale, $saleItem, $credit) {
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

            if ($credit) {
                CustomerCredit::create([
                    'shop_id' => $credit->shop_id, 'customer_id' => $credit->customer_id, 'user_id' => Auth::id(),
                    'sale_id' => $sale->id, 'amount' => -(float) $credit->amount, 'type' => 'return_cancelled',
                    'notes' => "Annulation du retour sur la vente {$sale->ticket_number}",
                ]);
                $sale->update(['store_credit_kept' => max(0, round((float) $sale->store_credit_kept - (float) $credit->amount, 2))]);
            }

            // Supprimer le retour (cascade sur l'entrée returned_inventories associée)
            $return->delete();

            // Recharger la vente avec les relations mises à jour
            $sale->refresh();
            $sale->load('items.returns');

            // Recalculer les montants de la vente après annulation du retour
            SaleReturnService::recalculate($sale);

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
}
