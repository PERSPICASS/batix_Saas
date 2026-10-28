<?php

namespace App\Services;

use App\Support\CounterSales;
use App\Support\Unit;
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
    /**
     * Le coût d'une unité vendue : celui figé sur la ligne au moment de la vente ou de la
     * facture, à défaut le coût actuel du produit (Product::unitCost).
     */
    private const INVOICE_COST = 'COALESCE(invoice_items.unit_cost, products.average_cost, products.purchase_price, 0)';

    /**
     * Part de la remise globale d'une vente / d'une facture qui s'applique à chaque ligne.
     * Les `* 1.0` et `/ 100.0` forcent une division décimale : entre deux entiers, SQLite
     * divise en entiers (200 / 2000 = 0) et la remise, comme la TVA, disparaissait.
     */
    private const INVOICE_KEEP = '(CASE WHEN invoices.subtotal > 0 THEN 1 - invoices.discount_amount * 1.0 / invoices.subtotal ELSE 1 END)';

    public function __construct(private ShopsOverview $overview) {}

    public function build(Shop $shop, CarbonInterface $start, CarbonInterface $end, CarbonInterface $previousStart, CarbonInterface $previousEnd): array
    {
        $shops = collect([$shop]);
        $current = $this->overview->figures($shops, $start, $end)[$shop->id];
        $previous = $this->overview->figures($shops, $previousStart, $previousEnd, withSnapshot: false)[$shop->id];

        $ids = [$shop->id];
        $byMonth = $start->diffInDays($end) > 62;
        $products = $this->products($ids, $start, $end);

        return [
            'figures' => $current,
            'previous' => $previous,
            'split' => $this->split($ids, $start, $end),
            'timeline' => [
                'unit' => $byMonth ? 'month' : 'day',
                'current' => $this->timeline($ids, $start, $end, $byMonth),
                'previous' => $this->timeline($ids, $previousStart, $previousEnd, $byMonth),
            ],
            'products' => $products->sortByDesc('revenue')->take(10)->values(),
            'categories' => $this->categories($products),
            'sellers' => $this->sellers($ids, $start, $end),
            'payment_methods' => $this->paymentMethods($ids, $start, $end),
            'expenses' => $this->expenses($ids, $start, $end),
            'low_stock' => $this->lowStock($shop),
            'debtors' => $this->debtors($ids),
        ];
    }

    /** Ventes au comptoir et factures (avoirs déduits) : ce qui compose le CA. */
    private function split(array $ids, CarbonInterface $start, CarbonInterface $end): array
    {
        $counter = (float) CounterSales::sales($ids, $start, $end)->sum('sales.original_total')
            - (float) CounterSales::returns($ids, $start, $end)->sum('returns.refund_amount');
        $invoiced = (float) $this->invoices($ids, $start, $end)->sum('total')
            - (float) DB::table('credit_notes')->whereIn('shop_id', $ids)
                ->whereDate('credit_note_date', '>=', $start->toDateString())->whereDate('credit_note_date', '<=', $end->toDateString())->sum('total');

        return ['counter' => round($counter, 2), 'invoices' => round($invoiced, 2)];
    }

    /**
     * Le CA jour par jour (ou mois par mois sur une longue période), chaque case remplie,
     * même à zéro : un trou dans la courbe se lit comme une absence de données.
     *
     * @return array<int, array{label: string, revenue: float}>
     */
    private function timeline(array $ids, CarbonInterface $start, CarbonInterface $end, bool $byMonth): array
    {
        $byDay = $this->overview->daily($ids, $start, $end);

        $series = [];
        foreach (CarbonPeriod::create($start->copy()->startOfDay(), $end->copy()->startOfDay()) as $day) {
            $key = $byMonth ? $day->format('Y-m') : $day->toDateString();
            $series[$key] = ($series[$key] ?? 0) + ($byDay[$day->toDateString()]['revenue'] ?? 0);
        }

        return collect($series)->map(fn ($revenue, $key) => ['label' => $key, 'revenue' => round($revenue, 2)])->values()->all();
    }

    /**
     * Chaque produit vendu : quantité, CA TTC et marge, ventes, factures et avoirs confondus.
     *
     * @return Collection<int, array{product_id: int|null, name: string, category: string|null, quantity: int, revenue: float, margin: float}>
     */
    public function products(array $ids, CarbonInterface $start, CarbonInterface $end): Collection
    {
        // Vendu au jour de la vente, remise d'origine au prorata ; rendu au jour du retour.
        $sold = CounterSales::saleItems($ids, $start, $end)
            ->groupBy('sale_items.product_id', 'sale_items.product_name')
            ->selectRaw('sale_items.product_id, sale_items.product_name AS name, SUM(sale_items.quantity) AS quantity,
                SUM(sale_items.quantity * sale_items.unit_price * '.CounterSales::KEEP.' * (1 + COALESCE(sale_items.tax_rate, 0) / 100.0)) AS revenue,
                SUM(sale_items.quantity * sale_items.unit_price * '.CounterSales::KEEP.') AS net,
                SUM(sale_items.quantity * '.CounterSales::COST.') AS cost')
            ->get();

        $returnedItems = CounterSales::returns($ids, $start, $end)
            ->groupBy('sale_items.product_id', 'sale_items.product_name')
            ->selectRaw('sale_items.product_id, sale_items.product_name AS name, SUM(returns.quantity_returned) AS quantity,
                SUM(returns.refund_amount) AS revenue, SUM(returns.net_amount) AS net,
                SUM(returns.quantity_returned * '.CounterSales::COST.') AS cost')
            ->get();

        $invoiced = DB::table('invoice_items')
            ->join('invoices', 'invoices.id', '=', 'invoice_items.invoice_id')
            ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
            ->whereNull('invoices.deleted_at')
            ->whereIn('invoices.shop_id', $ids)
            ->whereIn('invoices.status', ['sent', 'paid'])
            ->whereDate('invoices.invoice_date', '>=', $start->toDateString())->whereDate('invoices.invoice_date', '<=', $end->toDateString())
            ->groupBy('invoice_items.product_id', 'invoice_items.product_name')
            ->selectRaw('invoice_items.product_id, invoice_items.product_name AS name, SUM(invoice_items.quantity) AS quantity,
                SUM((invoice_items.total - invoice_items.tax_amount) * '.self::INVOICE_KEEP.' * (1 + COALESCE(invoice_items.tax_rate, 0) / 100.0)) AS revenue,
                SUM((invoice_items.total - invoice_items.tax_amount) * '.self::INVOICE_KEEP.') AS net,
                SUM(invoice_items.quantity * '.self::INVOICE_COST.') AS cost')
            ->get();

        $credited = DB::table('credit_note_items')
            ->join('credit_notes', 'credit_notes.id', '=', 'credit_note_items.credit_note_id')
            ->join('invoice_items', 'invoice_items.id', '=', 'credit_note_items.invoice_item_id')
            ->leftJoin('products', 'products.id', '=', 'invoice_items.product_id')
            ->whereIn('credit_notes.shop_id', $ids)
            ->whereDate('credit_notes.credit_note_date', '>=', $start->toDateString())->whereDate('credit_notes.credit_note_date', '<=', $end->toDateString())
            ->groupBy('invoice_items.product_id', 'credit_note_items.product_name')
            ->selectRaw('invoice_items.product_id, credit_note_items.product_name AS name, SUM(credit_note_items.quantity) AS quantity,
                SUM(credit_note_items.total * (1 + COALESCE(credit_note_items.tax_rate, 0) / 100.0)) AS revenue,
                SUM(credit_note_items.total) AS net,
                SUM(credit_note_items.quantity * '.self::INVOICE_COST.') AS cost')
            ->get();

        $lines = [];
        foreach ([[$sold, 1], [$returnedItems, -1], [$invoiced, 1], [$credited, -1]] as [$rows, $sign]) {
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
            'quantity' => Unit::round($line['quantity']),
            'revenue' => round($line['revenue'], 2),
            'margin' => round($line['net'] - $line['cost'], 2),
        ])->filter(fn ($line) => $line['quantity'] > 0 || $line['revenue'] != 0.0)->values();
    }

    /** @return array<int, array{name: string|null, revenue: float}> */
    public function categories(Collection $products): array
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
    public function sellers(array $ids, CarbonInterface $start, CarbonInterface $end): array
    {
        $rows = [];
        foreach ([
            CounterSales::sales($ids, $start, $end)->groupBy('sales.user_id')->selectRaw('sales.user_id, COUNT(*) AS n, SUM(sales.original_total) AS revenue'),
            $this->invoices($ids, $start, $end)->groupBy('user_id')->selectRaw('user_id, COUNT(*) AS n, SUM(total) AS revenue'),
        ] as $query) {
            foreach ($query->get() as $row) {
                $rows[$row->user_id] ??= ['count' => 0, 'revenue' => 0.0];
                $rows[$row->user_id]['count'] += (int) $row->n;
                $rows[$row->user_id]['revenue'] += (float) $row->revenue;
            }
        }

        // Un retour revient au vendeur de la vente qu'il réduit, comme un avoir à celui de la facture.
        foreach (CounterSales::returns($ids, $start, $end)->groupBy('sales.user_id')->selectRaw('sales.user_id, SUM(returns.refund_amount) AS revenue')->get() as $row) {
            $rows[$row->user_id] ??= ['count' => 0, 'revenue' => 0.0];
            $rows[$row->user_id]['revenue'] -= (float) $row->revenue;
        }

        $credited = DB::table('credit_notes')->join('invoices', 'invoices.id', '=', 'credit_notes.invoice_id')
            ->whereIn('credit_notes.shop_id', $ids)
            ->whereDate('credit_notes.credit_note_date', '>=', $start->toDateString())->whereDate('credit_notes.credit_note_date', '<=', $end->toDateString())
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

    /**
     * Les meilleurs clients de la période : tickets et factures, avoirs déduits. Une vente
     * sans client (passage au comptoir) n'appartient à personne et n'y figure pas.
     *
     * @return array<int, array{id: int, name: string|null, email: string|null, phone: string|null, count: int, revenue: float}>
     */
    public function customers(array $ids, CarbonInterface $start, CarbonInterface $end, int $limit = 10): array
    {
        $rows = [];
        foreach ([
            CounterSales::sales($ids, $start, $end)->whereNotNull('sales.customer_id')->groupBy('sales.customer_id')->selectRaw('sales.customer_id, COUNT(*) AS n, SUM(sales.original_total) AS revenue'),
            $this->invoices($ids, $start, $end)->whereNotNull('customer_id')->groupBy('customer_id')->selectRaw('customer_id, COUNT(*) AS n, SUM(total) AS revenue'),
        ] as $query) {
            foreach ($query->get() as $row) {
                $rows[$row->customer_id] ??= ['count' => 0, 'revenue' => 0.0];
                $rows[$row->customer_id]['count'] += (int) $row->n;
                $rows[$row->customer_id]['revenue'] += (float) $row->revenue;
            }
        }

        foreach (CounterSales::returns($ids, $start, $end)->whereNotNull('sales.customer_id')->groupBy('sales.customer_id')->selectRaw('sales.customer_id, SUM(returns.refund_amount) AS revenue')->get() as $row) {
            $rows[$row->customer_id] ??= ['count' => 0, 'revenue' => 0.0];
            $rows[$row->customer_id]['revenue'] -= (float) $row->revenue;
        }

        $credited = DB::table('credit_notes')
            ->whereIn('shop_id', $ids)
            ->whereDate('credit_note_date', '>=', $start->toDateString())->whereDate('credit_note_date', '<=', $end->toDateString())
            ->whereNotNull('customer_id')
            ->groupBy('customer_id')->selectRaw('customer_id, SUM(total) AS revenue')->get();
        foreach ($credited as $row) {
            $rows[$row->customer_id] ??= ['count' => 0, 'revenue' => 0.0];
            $rows[$row->customer_id]['revenue'] -= (float) $row->revenue;
        }

        uasort($rows, fn ($a, $b) => $b['revenue'] <=> $a['revenue']);
        $rows = array_slice($rows, 0, $limit, true);
        $customers = DB::table('customers')->whereIn('id', array_keys($rows))->get(['id', 'name', 'email', 'phone'])->keyBy('id');

        return collect($rows)->map(fn ($row, $customerId) => [
            'id' => $customerId,
            'name' => $customers[$customerId]->name ?? null,
            'email' => $customers[$customerId]->email ?? null,
            'phone' => $customers[$customerId]->phone ?? null,
            'count' => $row['count'],
            'revenue' => round($row['revenue'], 2),
        ])->values()->all();
    }

    /** Les ventes au comptoir par mode de paiement (une facture n'en porte pas). */
    /**
     * Le CA par moyen de paiement. La part réglée par un avoir (échange ou avoir client) est
     * comptée à part, sous « store_credit » : rangée sous le mode de la vente, une meuleuse
     * payée par l'avoir d'un échange passait pour 12 000 encaissés en espèces.
     */
    public function paymentMethods(array $ids, CarbonInterface $start, CarbonInterface $end): array
    {
        $byCredit = '(CASE WHEN sales.exchange_credit + sales.store_credit_used > sales.original_total THEN sales.original_total ELSE sales.exchange_credit + sales.store_credit_used END)';
        $methods = [];
        $add = function (string $method, int $count, float $revenue) use (&$methods) {
            $methods[$method] ??= ['method' => $method, 'count' => 0, 'revenue' => 0.0];
            $methods[$method]['count'] += $count;
            $methods[$method]['revenue'] += $revenue;
        };

        foreach (CounterSales::sales($ids, $start, $end)->groupBy('sales.payment_method')
            ->selectRaw("sales.payment_method, SUM(CASE WHEN sales.original_total > {$byCredit} THEN 1 ELSE 0 END) AS n, SUM(sales.original_total - {$byCredit}) AS revenue")
            ->get() as $row) {
            $add($row->payment_method, (int) $row->n, (float) $row->revenue);
        }

        $credit = CounterSales::sales($ids, $start, $end)
            ->selectRaw("SUM(CASE WHEN {$byCredit} > 0 THEN 1 ELSE 0 END) AS n, SUM({$byCredit}) AS revenue")->first();
        $add('store_credit', (int) $credit?->n, (float) $credit?->revenue);

        // Un retour sort par où il a été remboursé : des espèces rendues, ou un avoir (échange,
        // avoir client) qui n'a jamais quitté la caisse.
        foreach (CounterSales::returns($ids, $start, $end)->groupByRaw(CounterSales::RETURN_METHOD)
            ->selectRaw(CounterSales::RETURN_METHOD.' AS method, SUM(returns.refund_amount) AS revenue')->get() as $row) {
            $add($row->method, 0, -(float) $row->revenue);
        }

        return collect($methods)
            ->map(fn ($m) => [...$m, 'revenue' => round($m['revenue'], 2)])
            ->filter(fn ($m) => $m['revenue'] != 0 || $m['count'] > 0)
            ->sortByDesc('revenue')
            ->values()
            ->all();
    }

    public function expenses(array $ids, CarbonInterface $start, CarbonInterface $end): array
    {
        return Expense::whereIn('shop_id', $ids)
            ->whereDate('expense_date', '>=', $start->toDateString())->whereDate('expense_date', '<=', $end->toDateString())
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
                'stock' => (float) $product->stock_quantity,
                'min' => (float) $product->min_stock_alert,
            ])->all();
    }

    /** Les clients qui doivent le plus aujourd'hui : crédits de caisse et factures envoyées. */
    public function debtors(array $ids): array
    {
        $owed = [];

        $credit = Sale::whereIn('shop_id', $ids)->where('status', 'pending')->whereNotNull('customer_id')
            ->groupBy('customer_id')->selectRaw('customer_id, SUM(remaining_amount) AS owed')->get();
        $invoiced = Invoice::whereIn('shop_id', $ids)->where('status', 'sent')
            ->groupBy('customer_id')->selectRaw('customer_id, SUM(total) AS owed')->get();
        $credited = DB::table('credit_notes')->join('invoices', 'invoices.id', '=', 'credit_notes.invoice_id')
            ->whereNull('invoices.deleted_at')->whereIn('invoices.shop_id', $ids)->where('invoices.status', 'sent')
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

    private function invoices(array $ids, CarbonInterface $start, CarbonInterface $end)
    {
        return Invoice::query()->whereIn('shop_id', $ids)
            ->whereIn('status', ['sent', 'paid'])
            ->whereDate('invoice_date', '>=', $start->toDateString())->whereDate('invoice_date', '<=', $end->toDateString());
    }
}
