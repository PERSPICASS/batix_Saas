<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Le détail d'une boutique pour « Mes boutiques » : ses indicateurs, l'évolution de son CA
 * et ce qui le compose (produits, catégories, vendeurs, modes de paiement, dépenses), plus
 * ce qui demande une action (stock bas, clients qui doivent).
 *
 * Les indicateurs viennent de ShopsOverview, pour que la boutique affiche ici le même CA que
 * dans la liste. Les ventilations suivent les mêmes définitions, ligne par ligne : une ligne
 * vendue compte pour sa quantité non retournée, à son prix après la part de remise de la
 * vente, TTC ; une ligne de facture après la remise de la facture ; un avoir en moins.
 */
class ShopReport
{
    /** Le coût unitaire d'un produit, comme Product::unitCost(). */
    private const UNIT_COST = 'COALESCE(products.average_cost, products.purchase_price, 0)';

    /**
     * Part de la remise globale d'une vente / d'une facture qui s'applique à chaque ligne.
     * Les `* 1.0` et `/ 100.0` forcent une division décimale : entre deux entiers, SQLite
     * divise en entiers (200 / 2000 = 0) et la remise, comme la TVA, disparaissait.
     */
    private const SALE_KEEP = '(CASE WHEN sales.subtotal > 0 THEN 1 - sales.discount_amount * 1.0 / sales.subtotal ELSE 1 END)';
    private const INVOICE_KEEP = '(CASE WHEN invoices.subtotal > 0 THEN 1 - invoices.discount_amount * 1.0 / invoices.subtotal ELSE 1 END)';

    public function __construct(private ShopsOverview $overview) {}

    public function build(Shop $shop, CarbonInterface $start, CarbonInterface $end, CarbonInterface $previousStart, CarbonInterface $previousEnd): array
    {
        $shops = collect([$shop]);
        $current = $this->overview->figures($shops, $start, $end)[$shop->id];
        $previous = $this->overview->figures($shops, $previousStart, $previousEnd, withSnapshot: false)[$shop->id];

        $byMonth = $start->diffInDays($end) > 62;
        $products = $this->products($shop->id, $start, $end);

        return [
            'figures' => $current,
            'previous' => $previous,
            'split' => $this->split($shop->id, $start, $end),
            'timeline' => [
                'unit' => $byMonth ? 'month' : 'day',
                'current' => $this->timeline($shop->id, $start, $end, $byMonth),
                'previous' => $this->timeline($shop->id, $previousStart, $previousEnd, $byMonth),
            ],
            'products' => $products->sortByDesc('revenue')->take(10)->values(),
            'categories' => $this->categories($products),
            'sellers' => $this->sellers($shop->id, $start, $end),
            'payment_methods' => $this->paymentMethods($shop->id, $start, $end),
            'expenses' => $this->expenses($shop->id, $start, $end),
            'low_stock' => $this->lowStock($shop),
            'debtors' => $this->debtors($shop->id),
        ];
    }

    /** Ventes au comptoir et factures (avoirs déduits) : ce qui compose le CA. */
    private function split(int $shopId, CarbonInterface $start, CarbonInterface $end): array
    {
        $counter = (float) $this->sales($shopId, $start, $end)->sum('total');
        $invoiced = (float) $this->invoices($shopId, $start, $end)->sum('total')
            - (float) DB::table('credit_notes')->where('shop_id', $shopId)
                ->whereBetween('credit_note_date', [$start->toDateString(), $end->toDateString()])->sum('total');

        return ['counter' => round($counter, 2), 'invoices' => round($invoiced, 2)];
    }

    /**
     * Le CA jour par jour (ou mois par mois sur une longue période), chaque case remplie,
     * même à zéro : un trou dans la courbe se lit comme une absence de données.
     *
     * @return array<int, array{label: string, revenue: float}>
     */
    private function timeline(int $shopId, CarbonInterface $start, CarbonInterface $end, bool $byMonth): array
    {
        $byDay = [];
        $add = function ($rows, int $sign) use (&$byDay) {
            foreach ($rows as $row) {
                $day = substr((string) $row->day, 0, 10);
                $byDay[$day] = ($byDay[$day] ?? 0) + $sign * (float) $row->revenue;
            }
        };

        $add($this->sales($shopId, $start, $end)->groupByRaw('DATE(sale_date)')->selectRaw('DATE(sale_date) AS day, SUM(total) AS revenue')->get(), 1);
        $add($this->invoices($shopId, $start, $end)->groupBy('invoice_date')->selectRaw('invoice_date AS day, SUM(total) AS revenue')->get(), 1);
        $add(DB::table('credit_notes')->where('shop_id', $shopId)
            ->whereBetween('credit_note_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('credit_note_date')->selectRaw('credit_note_date AS day, SUM(total) AS revenue')->get(), -1);

        $series = [];
        foreach (CarbonPeriod::create($start->copy()->startOfDay(), $end->copy()->startOfDay()) as $day) {
            $key = $byMonth ? $day->format('Y-m') : $day->toDateString();
            $series[$key] = ($series[$key] ?? 0) + ($byDay[$day->toDateString()] ?? 0);
        }

        return collect($series)->map(fn ($revenue, $key) => ['label' => $key, 'revenue' => round($revenue, 2)])->values()->all();
    }

    /**
     * Chaque produit vendu : quantité, CA TTC et marge, ventes, factures et avoirs confondus.
     *
     * @return Collection<int, array{product_id: int|null, name: string, category: string|null, quantity: int, revenue: float, margin: float}>
     */
    private function products(int $shopId, CarbonInterface $start, CarbonInterface $end): Collection
    {
        $returned = DB::table('returns')->groupBy('sale_item_id')->selectRaw('sale_item_id, SUM(quantity_returned) AS qty');
        $kept = '(sale_items.quantity - COALESCE(returned.qty, 0))';

        $sold = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoinSub($returned, 'returned', 'returned.sale_item_id', '=', 'sale_items.id')
            ->where('sales.shop_id', $shopId)
            ->whereNotIn('sales.status', ['cancelled', 'returned'])
            ->whereBetween('sales.sale_date', [$start, $end])
            ->groupBy('sale_items.product_id', 'sale_items.product_name')
            ->selectRaw("sale_items.product_id, sale_items.product_name AS name, SUM({$kept}) AS quantity,
                SUM({$kept} * sale_items.unit_price * ".self::SALE_KEEP." * (1 + COALESCE(sale_items.tax_rate, 0) / 100.0)) AS revenue,
                SUM({$kept} * sale_items.unit_price * ".self::SALE_KEEP.") AS net,
                SUM({$kept} * ".self::UNIT_COST.') AS cost')
            ->get();

        $invoiced = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
            ->whereNull('invoices.deleted_at')
            ->where('invoices.shop_id', $shopId)
            ->whereIn('invoices.status', ['sent', 'paid'])
            ->whereBetween('invoices.invoice_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('invoice_items.product_id', 'invoice_items.product_name')
            ->selectRaw('invoice_items.product_id, invoice_items.product_name AS name, SUM(invoice_items.quantity) AS quantity,
                SUM((invoice_items.total - invoice_items.tax_amount) * '.self::INVOICE_KEEP.' * (1 + COALESCE(invoice_items.tax_rate, 0) / 100.0)) AS revenue,
                SUM((invoice_items.total - invoice_items.tax_amount) * '.self::INVOICE_KEEP.') AS net,
                SUM(invoice_items.quantity * '.self::UNIT_COST.') AS cost')
            ->get();

        $credited = DB::table('credit_note_items')
            ->join('credit_notes', 'credit_notes.id', '=', 'credit_note_items.credit_note_id')
            ->join('invoice_items', 'invoice_items.id', '=', 'credit_note_items.invoice_item_id')
            ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
            ->where('credit_notes.shop_id', $shopId)
            ->whereBetween('credit_notes.credit_note_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('invoice_items.product_id', 'credit_note_items.product_name')
            ->selectRaw('invoice_items.product_id, credit_note_items.product_name AS name, SUM(credit_note_items.quantity) AS quantity,
                SUM(credit_note_items.total * (1 + COALESCE(credit_note_items.tax_rate, 0) / 100.0)) AS revenue,
                SUM(credit_note_items.total) AS net,
                SUM(credit_note_items.quantity * '.self::UNIT_COST.') AS cost')
            ->get();

        $lines = [];
        foreach ([[$sold, 1], [$invoiced, 1], [$credited, -1]] as [$rows, $sign]) {
            foreach ($rows as $row) {
                $key = $row->product_id ?? 'name:'.$row->name;
                $lines[$key] ??= ['product_id' => $row->product_id, 'name' => $row->name, 'quantity' => 0, 'revenue' => 0.0, 'net' => 0.0, 'cost' => 0.0];
                foreach (['quantity', 'revenue', 'net', 'cost'] as $field) {
                    $lines[$key][$field] += $sign * (float) $row->{$field};
                }
            }
        }

        $categories = Product::whereIn('id', array_filter(array_column($lines, 'product_id')))
            ->with('category:id,name')->get(['id', 'category_id'])->keyBy('id');

        return collect($lines)->map(fn ($line) => [
            'product_id' => $line['product_id'],
            'name' => $line['name'],
            'category' => $line['product_id'] ? $categories->get($line['product_id'])?->category?->name : null,
            'quantity' => (int) $line['quantity'],
            'revenue' => round($line['revenue'], 2),
            'margin' => round($line['net'] - $line['cost'], 2),
        ])->filter(fn ($line) => $line['quantity'] > 0 || $line['revenue'] != 0.0)->values();
    }

    /** @return array<int, array{name: string|null, revenue: float}> */
    private function categories(Collection $products): array
    {
        return $products
            ->groupBy(fn ($line) => $line['category'] ?? '')
            ->map(fn ($lines, $name) => ['name' => $name === '' ? null : $name, 'revenue' => round($lines->sum('revenue'), 2)])
            ->sortByDesc('revenue')->values()->all();
    }

    /**
     * Ce que chaque vendeur a vendu : tickets et factures, avoirs déduits. Un avoir revient
     * au vendeur de la facture qu'il corrige, pas à celui qui l'a émis : c'est sa vente qui
     * a été réduite.
     */
    private function sellers(int $shopId, CarbonInterface $start, CarbonInterface $end): array
    {
        $rows = [];
        foreach ([$this->sales($shopId, $start, $end), $this->invoices($shopId, $start, $end)] as $query) {
            foreach ($query->groupBy('user_id')->selectRaw('user_id, COUNT(*) AS n, SUM(total) AS revenue')->get() as $row) {
                $rows[$row->user_id] ??= ['count' => 0, 'revenue' => 0.0];
                $rows[$row->user_id]['count'] += (int) $row->n;
                $rows[$row->user_id]['revenue'] += (float) $row->revenue;
            }
        }

        $credited = DB::table('credit_notes')->join('invoices', 'invoices.id', '=', 'credit_notes.invoice_id')
            ->where('credit_notes.shop_id', $shopId)
            ->whereBetween('credit_notes.credit_note_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('invoices.user_id')->selectRaw('invoices.user_id, SUM(credit_notes.total) AS revenue')->get();
        foreach ($credited as $row) {
            $rows[$row->user_id] ??= ['count' => 0, 'revenue' => 0.0];
            $rows[$row->user_id]['revenue'] -= (float) $row->revenue;
        }

        $names = DB::table('users')->whereIn('id', array_keys($rows))->pluck('name', 'id');

        return collect($rows)->map(fn ($row, $userId) => [
            // L'auteur peut avoir été supprimé depuis (user_id nullable sur les ventes).
            'name' => $names[$userId] ?? null,
            'count' => $row['count'],
            'revenue' => round($row['revenue'], 2),
        ])->sortByDesc('revenue')->values()->all();
    }

    /** Les ventes au comptoir par mode de paiement (une facture n'en porte pas). */
    private function paymentMethods(int $shopId, CarbonInterface $start, CarbonInterface $end): array
    {
        return $this->sales($shopId, $start, $end)
            ->groupBy('payment_method')
            ->selectRaw('payment_method, COUNT(*) AS n, SUM(total) AS revenue')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => ['method' => $row->payment_method, 'count' => (int) $row->n, 'revenue' => round((float) $row->revenue, 2)])
            ->all();
    }

    private function expenses(int $shopId, CarbonInterface $start, CarbonInterface $end): array
    {
        return Expense::where('shop_id', $shopId)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('category')
            ->selectRaw('category, COUNT(*) AS n, SUM(amount) AS amount')
            ->orderByDesc('amount')
            ->get()
            ->map(fn ($row) => ['category' => $row->category, 'count' => (int) $row->n, 'amount' => round((float) $row->amount, 2)])
            ->all();
    }

    /** Les produits sous leur seuil d'alerte, les plus en retard d'abord (Product::isLowStock). */
    private function lowStock(Shop $shop): array
    {
        return $shop->products()
            ->whereNull('parent_id')
            ->where('track_stock', true)
            ->whereNotNull('min_stock_alert')
            ->whereColumn('stock_quantity', '<=', 'min_stock_alert')
            ->orderByRaw('stock_quantity - min_stock_alert')
            ->limit(10)
            ->get(['id', 'name', 'stock_quantity', 'min_stock_alert'])
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'stock' => (int) $product->stock_quantity,
                'min' => (int) $product->min_stock_alert,
            ])->all();
    }

    /** Les clients qui doivent le plus aujourd'hui : crédits de caisse et factures envoyées. */
    private function debtors(int $shopId): array
    {
        $owed = [];

        $credit = Sale::where('shop_id', $shopId)->where('status', 'pending')->whereNotNull('customer_id')
            ->groupBy('customer_id')->selectRaw('customer_id, SUM(remaining_amount) AS owed')->get();
        $invoiced = Invoice::where('shop_id', $shopId)->where('status', 'sent')
            ->groupBy('customer_id')->selectRaw('customer_id, SUM(total) AS owed')->get();
        $credited = DB::table('credit_notes')->join('invoices', 'invoices.id', '=', 'credit_notes.invoice_id')
            ->whereNull('invoices.deleted_at')->where('invoices.shop_id', $shopId)->where('invoices.status', 'sent')
            ->groupBy('invoices.customer_id')->selectRaw('invoices.customer_id, SUM(credit_notes.total) AS owed')->get();

        foreach ([[$credit, 1], [$invoiced, 1], [$credited, -1]] as [$rows, $sign]) {
            foreach ($rows as $row) {
                $owed[$row->customer_id] = ($owed[$row->customer_id] ?? 0) + $sign * (float) $row->owed;
            }
        }

        $owed = array_filter($owed, fn ($amount) => $amount > 0);
        arsort($owed);
        $owed = array_slice($owed, 0, 10, true);
        $names = DB::table('customers')->whereIn('id', array_keys($owed))->pluck('name', 'id');

        return collect($owed)->map(fn ($amount, $customerId) => [
            'id' => $customerId,
            'name' => $names[$customerId] ?? null,
            'owed' => round($amount, 2),
        ])->values()->all();
    }

    /** Les ventes qui comptent, comme dans ShopsOverview. */
    private function sales(int $shopId, CarbonInterface $start, CarbonInterface $end)
    {
        return Sale::query()->where('shop_id', $shopId)
            ->whereNotIn('status', ['cancelled', 'returned'])
            ->whereBetween('sale_date', [$start, $end]);
    }

    /** Les factures émises, comme dans ShopsOverview. */
    private function invoices(int $shopId, CarbonInterface $start, CarbonInterface $end)
    {
        return Invoice::query()->where('shop_id', $shopId)
            ->whereIn('status', ['sent', 'paid'])
            ->whereBetween('invoice_date', [$start->toDateString(), $end->toDateString()]);
    }
}
