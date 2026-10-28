<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\User;
use App\Support\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Le retour d'un article sur une vente : partagé par le retour simple (ReturnsController)
 * et par l'échange (SaleExchangeService), pour qu'un même article rendu vaille la même
 * somme par les deux chemins.
 *
 * L'appelant ouvre la transaction : un échange enregistre ses retours et sa nouvelle vente
 * dans la même, si bien qu'un échange interrompu ne laisse aucun retour orphelin.
 */
class SaleReturnService
{
    /**
     * @return array{0: SaleReturn, 1: float, 2: float}  le retour, la baisse du total (le
     *         « remboursement » affiché) et ce que la boutique doit réellement rendre — sur
     *         une vente à crédit, le retour efface d'abord la dette.
     */
    public static function record(Sale $sale, SaleItem $saleItem, float $quantity, string $method, string $reason, ?string $notes, User $user): array
    {
        $alreadyReturned = Unit::round($saleItem->returns()->sum('quantity_returned'));
        if (Unit::round($alreadyReturned + $quantity) > $saleItem->quantity) {
            throw ValidationException::withMessages([
                'quantity_returned' => "La quantité retournée ne peut pas dépasser la quantité vendue. "
                    . "Déjà retourné: {$alreadyReturned}, disponible: " . Unit::round($saleItem->quantity - $alreadyReturned),
            ]);
        }

        $totalBefore = (float) $sale->total;
        $netBefore = (float) $sale->subtotal - (float) $sale->discount_amount;
        $changeBefore = (float) $sale->change_amount;

        $return = SaleReturn::create([
            'sale_id' => $sale->id,
            'sale_item_id' => $saleItem->id,
            'user_id' => $user->id,
            'quantity_returned' => $quantity,
            'refund_amount' => 0,
            'refund_method' => $method,
            'reason' => $reason,
            'notes' => $notes,
        ]);

        $sale->refresh();
        $sale->load('items.returns');

        // Le recalcul réduit la remise au prorata : on garde celle accordée au comptoir,
        // tant qu'elle est encore intacte, c'est-à-dire au tout premier retour.
        if ($sale->original_discount_amount === null && $sale->returns()->count() === 1) {
            $sale->update(['original_discount_amount' => $sale->discount_amount]);
        }

        self::recalculate($sale);

        // On rembourse exactement ce dont le total a baissé, TVA et remise comprises.
        // C'était prix unitaire × quantité : sur une vente à 18 % de TVA le client
        // récupérait moins qu'il n'avait payé, avec une remise la boutique rendait trop.
        $refundAmount = round($totalBefore - (float) $sale->total, 2);
        // Et sa part hors taxes, pour la marge du jour du retour (CounterSales).
        $return->update([
            'refund_amount' => $refundAmount,
            'net_amount' => round($netBefore - ((float) $sale->subtotal - (float) $sale->discount_amount), 2),
        ]);

        return [$return, $refundAmount, round((float) $sale->change_amount - $changeBefore, 2)];
    }

    /**
     * Ce que la vente deviendrait si l'on rendait en plus ces quantités, sans rien écrire.
     * Sert à afficher l'avoir d'un échange avant de le valider.
     *
     * @param  array<int, float>  $extraReturned  quantité rendue en plus, par sale_item_id
     * @return array{subtotal: float, tax_amount: float, discount_amount: float, total: float, remaining_amount: float, change_amount: float, all_returned: bool}
     */
    public static function amountsAfter(Sale $sale, array $extraReturned = []): array
    {
        $subtotal = 0;
        $allReturned = true;

        foreach ($sale->items as $item) {
            $returned = Unit::round($item->returns->sum('quantity_returned') + ($extraReturned[$item->id] ?? 0));
            $subtotal += $item->unit_price * Unit::round($item->quantity - $returned);
            $allReturned = $allReturned && $returned >= $item->quantity;
        }

        // Taxe et remise au prorata du sous-total d'origine.
        $originalSubtotal = $sale->subtotal ?? 0;
        $taxRate = $originalSubtotal > 0 ? ($sale->tax_amount ?? 0) / $originalSubtotal : 0;
        $discountRate = $originalSubtotal > 0 ? ($sale->discount_amount ?? 0) / $originalSubtotal : 0;
        $taxAmount = $subtotal * $taxRate;
        $discountAmount = $subtotal * $discountRate;

        $total = max(0, $subtotal + $taxAmount - $discountAmount);
        $amountPaid = $sale->amount_paid ?? 0;

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'discount_amount' => $discountAmount,
            'total' => $total,
            'remaining_amount' => max(0, $total - $amountPaid),
            // La monnaie suit le total, comme à la vente (Sale::calculateTotals) : elle restait
            // figée à sa valeur d'origine, sur la page de la vente comme sur le ticket.
            // Moins ce qui a déjà été gardé en avoir lors d'un échange : déjà rendu au client.
            'change_amount' => max(0, $amountPaid - $total - (float) $sale->store_credit_kept),
            'all_returned' => $allReturned,
        ];
    }

    /**
     * Recalcule tous les montants d'une vente après des retours.
     * Impacte: subtotal, tax_amount, discount_amount, total, remaining_amount, change_amount, status
     */
    public static function recalculate(Sale $sale): void
    {
        $amounts = self::amountsAfter($sale);

        $sale->update([
            'subtotal' => $amounts['subtotal'],
            'tax_amount' => $amounts['tax_amount'],
            'discount_amount' => $amounts['discount_amount'],
            'total' => $amounts['total'],
            'remaining_amount' => $amounts['remaining_amount'],
            'change_amount' => $amounts['change_amount'],
            'status' => match (true) {
                $amounts['all_returned'] => 'returned',
                $amounts['remaining_amount'] <= 0 => 'completed',
                default => 'pending',
            },
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
