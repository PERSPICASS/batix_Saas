<?php

namespace App\Support;

use App\Models\Sale;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Les ventes au comptoir telles que la comptabilité les compte.
 *
 * Une vente compte pour son montant d'origine au jour de la vente ; un retour (simple ou
 * dans un échange) compte en négatif au jour du retour — exactement comme une facture et
 * son avoir. Le CA d'un mois clos ne bouge donc plus quand un client rapporte un article
 * plus tard. Sur toute la durée, ventes moins retours retombent sur les tickets actuels :
 * `sales:audit-revenue` le vérifie.
 *
 * Seules les ventes annulées sont écartées : une vente annulée n'a jamais eu lieu. Une vente
 * entièrement retournée, elle, a bien été vendue, puis rendue.
 *
 * Tous les chiffres de vente au comptoir (Mes boutiques, rapport, analytique, tableau de
 * bord, API) passent par ici, pour qu'aucun écran ne compte autrement qu'un autre.
 */
final class CounterSales
{
    /** Le coût d'une unité : celui figé sur la ligne, sinon le CUMP, sinon le prix d'achat. */
    public const COST = 'COALESCE(sale_items.unit_cost, products.average_cost, products.purchase_price, 0)';

    /** La remise d'origine, rapportée au sous-total d'origine (quantités vendues). */
    public const KEEP = '(CASE WHEN sales.original_net + COALESCE(sales.original_discount_amount, sales.discount_amount, 0) > 0
        THEN sales.original_net * 1.0 / (sales.original_net + COALESCE(sales.original_discount_amount, sales.discount_amount, 0)) ELSE 1 END)';

    /** Ce qu'un retour a réglé autrement qu'en argent : il ne sort pas de la caisse. */
    public const RETURN_METHOD = "(CASE WHEN returns.refund_method IN ('store_credit', 'exchange') THEN 'store_credit' ELSE returns.refund_method END)";

    /** Les ventes du jour de vente, au montant d'origine (`original_total`, `original_net`). */
    public static function sales(array $shopIds, CarbonInterface $start, CarbonInterface $end): EloquentBuilder
    {
        return Sale::query()
            ->whereIn('sales.shop_id', $shopIds)
            ->where('sales.status', '!=', 'cancelled')
            ->whereBetween('sales.sale_date', [$start, $end]);
    }

    /** Leurs lignes, quantités vendues entières : les retours ont leurs propres lignes. */
    public static function saleItems(array $shopIds, CarbonInterface $start, CarbonInterface $end): Builder
    {
        return DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->whereIn('sales.shop_id', $shopIds)
            ->where('sales.status', '!=', 'cancelled')
            ->whereBetween('sales.sale_date', [$start, $end]);
    }

    /**
     * Les retours du jour du retour, joints à leur vente et à leur ligne : `refund_amount`
     * (TTC) et `net_amount` (HT) sont ce dont la vente a baissé.
     */
    public static function returns(array $shopIds, CarbonInterface $start, CarbonInterface $end): Builder
    {
        return DB::table('returns')
            ->join('sales', 'sales.id', '=', 'returns.sale_id')
            ->join('sale_items', 'sale_items.id', '=', 'returns.sale_item_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->whereIn('sales.shop_id', $shopIds)
            ->where('sales.status', '!=', 'cancelled')
            ->whereBetween('returns.return_date', [$start, $end]);
    }

    /**
     * Reconstitue les montants d'origine des ventes déjà là (migration du 2026-10-29).
     *
     * - TTC : le total actuel plus ce que les retours en ont retiré (`refund_amount` est
     *   exactement la baisse du total, cf. SaleReturnService).
     * - HT : sans retour, le ticket lui-même. Avec retours, la remise d'origine ne se lit pas
     *   toujours : `original_discount_amount` n'est gardé que depuis peu, et `discount_amount`
     *   a été réduit par les retours. La remise réduisant d'autant le HT et la TVA (GlobalDiscount),
     *   son taux se déduit du TTC d'origine rapporté aux lignes (`sale_items.total`, TTC avant
     *   remise, jamais modifiées par un retour).
     * - La remise d'origine manquante est posée, et chaque retour reçoit sa part HT.
     */
    public static function backfill(): void
    {
        $refunded = '(SELECT COALESCE(SUM(returns.refund_amount), 0) FROM returns WHERE returns.sale_id = sales.id)';
        $hasReturns = 'EXISTS (SELECT 1 FROM returns WHERE returns.sale_id = sales.id)';
        $lines = '(SELECT COALESCE(SUM(sale_items.quantity * sale_items.unit_price), 0) FROM sale_items WHERE sale_items.sale_id = sales.id)';
        $linesTtc = '(SELECT COALESCE(SUM(sale_items.total), 0) FROM sale_items WHERE sale_items.sale_id = sales.id)';

        DB::table('sales')->update(['original_total' => DB::raw("sales.total + {$refunded}")]);

        DB::table('sales')->update([
            'original_net' => DB::raw("CASE WHEN NOT {$hasReturns} THEN sales.subtotal - sales.discount_amount
                WHEN {$linesTtc} > 0 THEN ROUND({$lines} * sales.original_total / {$linesTtc}, 2)
                ELSE {$lines} END"),
        ]);

        DB::table('sales')->whereNull('original_discount_amount')->whereRaw($hasReturns)
            ->update(['original_discount_amount' => DB::raw("{$lines} - sales.original_net")]);

        DB::table('returns')->update([
            'net_amount' => DB::raw("ROUND(returns.quantity_returned * (SELECT sale_items.unit_price FROM sale_items WHERE sale_items.id = returns.sale_item_id)
                * (SELECT ".self::KEEP." FROM sales WHERE sales.id = returns.sale_id), 2)"),
        ]);
    }
}
