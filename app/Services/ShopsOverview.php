<?php

namespace App\Services;

use App\Models\CreditNote;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Sale;
use App\Models\Shop;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Les chiffres de chaque boutique d'un compte, pour la vue « Mes boutiques ».
 *
 * Les définitions, arrêtées avec Fred le 2026-10-25 :
 *
 * - CA = ce qui a été VENDU sur la période, crédit compris : les ventes au comptoir hors
 *   annulées (les retours ont déjà réduit leur total, voir ReturnsController), plus les
 *   factures émises (envoyées ou payées, pas les brouillons ni les annulées), moins les
 *   avoirs émis sur la période. TTC, comme les tickets et les factures.
 * - Marge brute = CA hors taxes (remises et retours déduits) moins le coût d'achat de ce
 *   qui est parti, au coût du produit (moyenne pondérée, à défaut le dernier prix d'achat,
 *   voir Product::unitCost). Les lignes de vente ne gardent pas le coût du jour de la
 *   vente : c'est le coût actuel qui sert, la même base que la valeur du stock.
 * - Créances = ce que les clients doivent AUJOURD'HUI, quelle que soit la période : le reste
 *   dû des ventes à crédit, plus les factures envoyées non payées, avoirs déduits.
 * - Stock = Shop::stockStats(), la même définition que la fiche boutique.
 *
 * Chaque chiffre est une requête groupée par boutique : le coût ne dépend pas du nombre
 * de boutiques.
 */
class ShopsOverview
{
    /**
     * @param  Collection<int, Shop>  $shops
     * @return array<int, array<string, float|int>>  indexé par id de boutique
     */
    public function figures(Collection $shops, CarbonInterface $start, CarbonInterface $end, bool $withSnapshot = true): array
    {
        $ids = $shops->pluck('id')->all();
        $figures = [];

        foreach ($ids as $id) {
            $figures[$id] = [
                'revenue' => 0.0, 'count' => 0, 'net_excl_tax' => 0.0, 'cost' => 0.0,
                'expenses' => 0.0,
            ];
        }

        if ($ids === []) {
            return $figures;
        }

        $add = function (Collection $rows, array $map) use (&$figures) {
            foreach ($rows as $row) {
                foreach ($map as $key => [$column, $sign]) {
                    $figures[$row->shop_id][$key] += $sign * (float) $row->{$column};
                }
            }
        };

        // Ventes au comptoir. Une vente entièrement retournée (statut « returned ») a un
        // total nul : elle ne compte pas non plus comme une vente.
        $add(Sale::query()
            ->whereIn('shop_id', $ids)
            ->whereNotIn('status', ['cancelled', 'returned'])
            ->whereBetween('sale_date', [$start, $end])
            ->groupBy('shop_id')
            ->selectRaw('shop_id, COUNT(*) AS n, SUM(total) AS revenue, SUM(subtotal - discount_amount) AS net')
            ->get(), ['revenue' => ['revenue', 1], 'count' => ['n', 1], 'net_excl_tax' => ['net', 1]]);

        // Ce qu'ont coûté les articles vendus, quantités retournées déduites.
        $add(DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoinSub(
                DB::table('returns')->groupBy('sale_item_id')->selectRaw('sale_item_id, SUM(quantity_returned) AS qty'),
                'returned', 'returned.sale_item_id', '=', 'sale_items.id'
            )
            ->whereIn('sales.shop_id', $ids)
            ->whereNotIn('sales.status', ['cancelled', 'returned'])
            ->whereBetween('sales.sale_date', [$start, $end])
            ->groupBy('sales.shop_id')
            ->selectRaw('sales.shop_id, SUM((sale_items.quantity - COALESCE(returned.qty, 0)) * '.self::UNIT_COST.') AS cost')
            ->get(), ['cost' => ['cost', 1]]);

        // Factures émises (le scope SoftDeletes écarte les factures supprimées).
        $add(Invoice::query()
            ->whereIn('shop_id', $ids)
            ->whereIn('status', ['sent', 'paid'])
            ->whereBetween('invoice_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('shop_id')
            ->selectRaw('shop_id, COUNT(*) AS n, SUM(total) AS revenue, SUM(subtotal - discount_amount) AS net')
            ->get(), ['revenue' => ['revenue', 1], 'count' => ['n', 1], 'net_excl_tax' => ['net', 1]]);

        $add(DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
            ->whereNull('invoices.deleted_at')
            ->whereIn('invoices.shop_id', $ids)
            ->whereIn('invoices.status', ['sent', 'paid'])
            ->whereBetween('invoices.invoice_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('invoices.shop_id')
            ->selectRaw('invoices.shop_id, SUM(invoice_items.quantity * '.self::UNIT_COST.') AS cost')
            ->get(), ['cost' => ['cost', 1]]);

        // Avoirs émis sur la période : ils retirent du CA ce qu'ils créditent, et le coût
        // des articles crédités ne pèse plus sur la marge.
        $add(CreditNote::query()
            ->whereIn('shop_id', $ids)
            ->whereBetween('credit_note_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('shop_id')
            ->selectRaw('shop_id, SUM(total) AS revenue, SUM(subtotal) AS net')
            ->get(), ['revenue' => ['revenue', -1], 'net_excl_tax' => ['net', -1]]);

        $add(DB::table('credit_note_items')
            ->join('credit_notes', 'credit_notes.id', '=', 'credit_note_items.credit_note_id')
            ->join('invoice_items', 'invoice_items.id', '=', 'credit_note_items.invoice_item_id')
            ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
            ->whereIn('credit_notes.shop_id', $ids)
            ->whereBetween('credit_notes.credit_note_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('credit_notes.shop_id')
            ->selectRaw('credit_notes.shop_id, SUM(credit_note_items.quantity * '.self::UNIT_COST.') AS cost')
            ->get(), ['cost' => ['cost', -1]]);

        $add(Expense::query()
            ->whereIn('shop_id', $ids)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('shop_id')
            ->selectRaw('shop_id, SUM(amount) AS amount')
            ->get(), ['expenses' => ['amount', 1]]);

        foreach ($figures as $id => $f) {
            $figures[$id] = [
                'revenue' => round($f['revenue'], 2),
                'count' => (int) $f['count'],
                'average_basket' => $f['count'] > 0 ? round($f['revenue'] / $f['count'], 2) : 0.0,
                'gross_margin' => round($f['net_excl_tax'] - $f['cost'], 2),
                'expenses' => round($f['expenses'], 2),
            ];
        }

        if ($withSnapshot) {
            $receivables = $this->receivables($ids);

            foreach ($shops as $shop) {
                $figures[$shop->id]['receivables'] = $receivables[$shop->id] ?? 0.0;
                $figures[$shop->id] += array_intersect_key($shop->stockStats(), array_flip(['stock_value', 'low_stock']));
            }
        }

        return $figures;
    }

    /** Le coût unitaire d'un produit, comme Product::unitCost(). */
    private const UNIT_COST = 'COALESCE(products.average_cost, products.purchase_price, 0)';

    /**
     * Ce que les clients doivent aujourd'hui.
     *
     * @param  array<int, int>  $ids
     * @return array<int, float>
     */
    private function receivables(array $ids): array
    {
        $owed = [];

        $sales = Sale::query()
            ->whereIn('shop_id', $ids)
            ->where('status', 'pending')
            ->groupBy('shop_id')
            ->selectRaw('shop_id, SUM(remaining_amount) AS owed')
            ->get();

        // Une facture envoyée n'est pas encore payée : elle est due, moins ses avoirs.
        $invoices = Invoice::query()
            ->whereIn('shop_id', $ids)
            ->where('status', 'sent')
            ->groupBy('shop_id')
            ->selectRaw('shop_id, SUM(total) AS owed')
            ->get();

        $credited = DB::table('credit_notes')
            ->join('invoices', 'invoices.id', '=', 'credit_notes.invoice_id')
            ->whereNull('invoices.deleted_at')
            ->whereIn('invoices.shop_id', $ids)
            ->where('invoices.status', 'sent')
            ->groupBy('invoices.shop_id')
            ->selectRaw('invoices.shop_id, SUM(credit_notes.total) AS owed')
            ->get();

        foreach ([[$sales, 1], [$invoices, 1], [$credited, -1]] as [$rows, $sign]) {
            foreach ($rows as $row) {
                $owed[$row->shop_id] = ($owed[$row->shop_id] ?? 0) + $sign * (float) $row->owed;
            }
        }

        return array_map(fn ($value) => round(max($value, 0), 2), $owed);
    }
}
