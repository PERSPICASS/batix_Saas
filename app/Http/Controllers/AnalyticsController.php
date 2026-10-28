<?php

namespace App\Http\Controllers;

use App\Exports\SalesAnalyticsExport;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Shop;
use App\Services\ShopReport;
use App\Services\ShopsOverview;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        // Rediriger les caissiers vers la liste des ventes (pas accès aux analytics)
        if ($this->isCashier($request)) {
            return redirect()->route('sales.index', ['code_user' => $request->route('code_user')]);
        }

        $data = $this->analyticsData($request);

        return Inertia::render('Analytics/Index', [
            ...$data,
            'shops' => $data['shops']->map(fn($shop) => [
                'id' => $shop->id,
                'name' => $shop->name,
            ]),
        ]);
    }

    /**
     * Les chiffres de la page, à l'identique, dans un classeur Excel : mêmes calculs, même
     * période, même boutique active, mêmes paramètres de comparaison (repris de l'URL).
     */
    public function export(Request $request)
    {
        abort_if($this->isCashier($request), 403);

        $data = $this->analyticsData($request);
        $range = $this->getDateRange($data['currentPeriod']);
        $activeShop = $data['activeShopId'] ? $data['shops']->find($data['activeShopId']) : null;

        return Excel::download(
            new SalesAnalyticsExport(
                $data,
                $range['start'],
                $range['end'],
                $activeShop?->name ?? 'Toutes les boutiques',
            ),
            'Statistiques-' . $data['currentPeriod'] . '-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    private function isCashier(Request $request): bool
    {
        return in_array($request->user()->role, ['cashier', 'caisse', 'employee']);
    }

    /**
     * Tout ce que la page affiche, calculé une fois pour la page et pour l'export.
     */
    private function analyticsData(Request $request): array
    {
        $user = $request->user();

        $shops = Shop::where('user_id', $user->id)->get();
        $shopIds = $shops->pluck('id');
        $activeShopId = session('active_shop_id');

        // Si une boutique active est sélectionnée, filtrer sur celle-ci
        $filterShopIds = $activeShopId ? [$activeShopId] : $shopIds;

        // Période sélectionnée
        $period = $request->get('period', 'month');
        $dateRange = $this->getDateRange($period);
        $previousRange = $this->getPreviousDateRange($period);

        // Paramètres de comparaison
        $compareMode = $request->get('compare_mode', 'year');
        $year1 = (int) $request->get('year1', date('Y'));
        $year2 = (int) $request->get('year2', date('Y') - 1);
        $month1 = (int) $request->get('month1', date('n'));
        $month2 = (int) $request->get('month2', date('n'));
        $monthYear1 = (int) $request->get('month_year1', date('Y'));
        $monthYear2 = (int) $request->get('month_year2', date('Y') - 1);

        // Récupérer le symbole de devise
        $currencySymbol = 'FCFA';
        if ($activeShopId) {
            $activeShop = $shops->find($activeShopId);
            if ($activeShop) {
                $currencySymbol = $this->getCurrencySymbol($activeShop->currency ?? 'XOF');
            }
        }

        return [
            'kpis' => $this->getKPIs($filterShopIds, $dateRange, $previousRange),
            'salesChart' => $this->getSalesChart($filterShopIds, $period),
            'topProducts' => $this->getTopProducts($filterShopIds, $dateRange),
            'salesByCategory' => $this->getSalesByCategory($filterShopIds, $dateRange),
            'topCustomers' => $this->getTopCustomers($filterShopIds, $dateRange),
            'paymentMethods' => $this->getPaymentMethods($filterShopIds, $dateRange),
            // Performance par boutique : toutes les boutiques du compte, pour comparer
            'shopPerformance' => $this->getShopPerformance($shopIds, $dateRange),
            'comparisonData' => $this->getComparisonData($filterShopIds, $compareMode, compact(
                'year1', 'year2', 'month1', 'month2', 'monthYear1', 'monthYear2'
            )),
            'currentPeriod' => $period,
            'currencySymbol' => $currencySymbol,
            'shops' => $shops,
            'activeShopId' => $activeShopId,
        ];
    }
    
    private function getDateRange(string $period): array
    {
        $now = Carbon::now();
        
        return match($period) {
            'today' => [
                'start' => $now->copy()->startOfDay(),
                'end' => $now->copy()->endOfDay(),
            ],
            'week' => [
                'start' => $now->copy()->startOfWeek(),
                'end' => $now->copy()->endOfWeek(),
            ],
            'month' => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
            ],
            'quarter' => [
                'start' => $now->copy()->startOfQuarter(),
                'end' => $now->copy()->endOfQuarter(),
            ],
            'year' => [
                'start' => $now->copy()->startOfYear(),
                'end' => $now->copy()->endOfYear(),
            ],
            default => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
            ],
        };
    }
    
    private function getPreviousDateRange(string $period): array
    {
        $now = Carbon::now();
        
        return match($period) {
            'today' => [
                'start' => $now->copy()->subDay()->startOfDay(),
                'end' => $now->copy()->subDay()->endOfDay(),
            ],
            'week' => [
                'start' => $now->copy()->subWeek()->startOfWeek(),
                'end' => $now->copy()->subWeek()->endOfWeek(),
            ],
            'month' => [
                'start' => $now->copy()->subMonth()->startOfMonth(),
                'end' => $now->copy()->subMonth()->endOfMonth(),
            ],
            'quarter' => [
                'start' => $now->copy()->subQuarter()->startOfQuarter(),
                'end' => $now->copy()->subQuarter()->endOfQuarter(),
            ],
            'year' => [
                'start' => $now->copy()->subYear()->startOfYear(),
                'end' => $now->copy()->subYear()->endOfYear(),
            ],
            default => [
                'start' => $now->copy()->subMonth()->startOfMonth(),
                'end' => $now->copy()->subMonth()->endOfMonth(),
            ],
        };
    }
    
    /**
     * Les ventes du comptoir et les factures, avec les définitions de « Mes boutiques »
     * (ShopsOverview, ShopReport) : crédit compris, annulées exclues, retours et avoirs
     * déduits, marge au coût du produit. Cette page ne comptait que les ventes terminées et
     * calculait la marge sur le dernier prix d'achat, sans remise ni retour : elle donnait
     * un autre CA que le tableau de bord et « Mes boutiques » pour la même boutique.
     */
    private function overview(): ShopsOverview
    {
        return app(ShopsOverview::class);
    }

    private function report(): ShopReport
    {
        return app(ShopReport::class);
    }

    private function ids($shopIds): array
    {
        return collect($shopIds)->map(fn ($id) => (int) $id)->all();
    }

    /** CA, nombre de ventes, HT et coût, additionnés sur une série de jours. */
    private function sumDays(array $days): array
    {
        return [
            'revenue' => (float) collect($days)->sum('revenue'),
            'count' => (int) collect($days)->sum('count'),
            'net' => (float) collect($days)->sum('net_excl_tax'),
            'cost' => (float) collect($days)->sum('cost'),
        ];
    }

    private function getKPIs($shopIds, array $dateRange, array $previousRange): array
    {
        $ids = $this->ids($shopIds);
        $current = $this->sumDays($this->overview()->daily($ids, $dateRange['start'], $dateRange['end']));
        $previous = $this->sumDays($this->overview()->daily($ids, $previousRange['start'], $previousRange['end']));

        $avgBasket = $current['count'] > 0 ? $current['revenue'] / $current['count'] : 0;
        $previousAvgBasket = $previous['count'] > 0 ? $previous['revenue'] / $previous['count'] : 0;

        // Taux de marge sur le CA hors taxes : la marge est elle-même hors taxes.
        $margin = $current['net'] - $current['cost'];
        $marginRate = $current['net'] > 0 ? round(($margin / $current['net']) * 100, 1) : 0;

        $newCustomers = Customer::whereIn('shop_id', $ids)
            ->whereBetween('created_at', [$dateRange['start'], $dateRange['end']])
            ->count();

        return [
            'revenue' => [
                'value' => round($current['revenue'], 2),
                'growth' => $this->calcGrowth($current['revenue'], $previous['revenue']),
                'previousValue' => round($previous['revenue'], 2),
            ],
            'salesCount' => [
                'value' => $current['count'],
                'growth' => $this->calcGrowth($current['count'], $previous['count']),
                'previousValue' => $previous['count'],
            ],
            'avgBasket' => [
                'value' => round($avgBasket, 0),
                'growth' => $this->calcGrowth($avgBasket, $previousAvgBasket),
                'previousValue' => round($previousAvgBasket, 0),
            ],
            'marginRate' => [
                'value' => $marginRate,
                'margin' => round($margin, 2),
            ],
            'newCustomers' => [
                'value' => $newCustomers,
            ],
        ];
    }

    private function getSalesChart($shopIds, string $period): array
    {
        $ids = $this->ids($shopIds);
        $now = Carbon::now();

        if ($period === 'today') {
            $hours = $this->overview()->hourly($ids, $now->copy()->startOfDay(), $now->copy()->endOfDay());

            return collect(range(0, 23))->map(function ($i) use ($now, $hours) {
                $hour = $now->copy()->startOfDay()->addHours($i);

                return ['label' => $hour->format('H:00'), 'value' => round($hours[$hour->format('Y-m-d H')] ?? 0, 2)];
            })->all();
        }

        $buckets = [];
        switch ($period) {
            case 'week':
                for ($i = 0; $i < 7; $i++) {
                    $day = $now->copy()->startOfWeek()->addDays($i);
                    $buckets[] = [$day, $day->copy()->endOfDay(), $day->isoFormat('ddd D')];
                }
                break;

            case 'month':
                $start = $now->copy()->startOfMonth();
                $endOfMonth = $now->copy()->endOfMonth();
                for ($week = 1; $start <= $endOfMonth; $week++) {
                    $end = $start->copy()->endOfWeek()->min($endOfMonth);
                    $buckets[] = [$start->copy(), $end, "Sem. {$week}"];
                    $start = $end->copy()->addDay()->startOfDay();
                }
                break;

            case 'quarter':
            case 'year':
                $first = $period === 'quarter' ? $now->copy()->startOfQuarter() : $now->copy()->startOfYear();
                for ($i = 0; $i < ($period === 'quarter' ? 3 : 12); $i++) {
                    $month = $first->copy()->addMonthsNoOverflow($i);
                    $buckets[] = [$month->copy()->startOfMonth(), $month->copy()->endOfMonth(), $month->isoFormat('MMM')];
                }
                break;
        }

        if ($buckets === []) {
            return [];
        }

        $days = $this->overview()->daily($ids, $buckets[0][0], end($buckets)[1]);

        return array_map(fn ($bucket) => [
            'label' => $bucket[2],
            'value' => round($this->revenueBetween($days, $bucket[0], $bucket[1]), 2),
        ], $buckets);
    }

    private function revenueBetween(array $days, Carbon $start, Carbon $end): float
    {
        return (float) collect($days)
            ->filter(fn ($figures, $day) => $day >= $start->toDateString() && $day <= $end->toDateString())
            ->sum('revenue');
    }

    private function getTopProducts($shopIds, array $dateRange, int $limit = 10): array
    {
        $lines = $this->report()->products($this->ids($shopIds), $dateRange['start'], $dateRange['end'])
            ->sortByDesc('revenue')->take($limit)->values();
        $products = Product::whereIn('id', $lines->pluck('product_id')->filter())->get(['id', 'sku', 'image'])->keyBy('id');

        return $lines->map(fn ($line) => [
            'id' => $line['product_id'],
            'name' => $line['name'] ?? 'Produit supprimé',
            'sku' => $products->get($line['product_id'])?->sku ?? '-',
            'image' => $products->get($line['product_id'])?->image,
            'quantity' => $line['quantity'],
            'revenue' => $line['revenue'],
        ])->all();
    }

    private function getSalesByCategory($shopIds, array $dateRange): array
    {
        $report = $this->report();
        $categories = collect($report->categories($report->products($this->ids($shopIds), $dateRange['start'], $dateRange['end'])))->take(8);
        $total = $categories->sum('revenue');

        return $categories->map(fn ($category) => [
            'name' => $category['name'] ?? 'Sans catégorie',
            'revenue' => $category['revenue'],
            'percentage' => $total > 0 ? round(($category['revenue'] / $total) * 100, 1) : 0,
        ])->all();
    }

    private function getTopCustomers($shopIds, array $dateRange, int $limit = 10): array
    {
        return collect($this->report()->customers($this->ids($shopIds), $dateRange['start'], $dateRange['end'], $limit))
            ->map(fn ($customer) => [
                'id' => $customer['id'],
                'name' => $customer['name'] ?? 'Client supprimé',
                'email' => $customer['email'] ?? '',
                'phone' => $customer['phone'] ?? '',
                'salesCount' => $customer['count'],
                'totalSpent' => $customer['revenue'],
            ])->all();
    }

    private function getPaymentMethods($shopIds, array $dateRange): array
    {
        $methods = collect($this->report()->paymentMethods($this->ids($shopIds), $dateRange['start'], $dateRange['end']));
        $grandTotal = $methods->sum('revenue');

        $labels = [
            'cash' => 'Espèces',
            'card' => 'Carte bancaire',
            'mobile' => 'Mobile Money',
            'mobile_money' => 'Mobile Money',
            'transfer' => 'Virement',
            'check' => 'Chèque',
            'multiple' => 'Multiple',
            'credit' => 'Crédit',
        ];

        return $methods->map(fn ($method) => [
            'method' => $labels[$method['method']] ?? $method['method'],
            'count' => $method['count'],
            'total' => $method['revenue'],
            'percentage' => $grandTotal > 0 ? round(($method['revenue'] / $grandTotal) * 100, 1) : 0,
        ])->all();
    }

    /** Toutes les boutiques du compte, même sans vente sur la période : c'est celle-là qu'il faut voir. */
    private function getShopPerformance($shopIds, array $dateRange): array
    {
        $shops = Shop::whereIn('id', $this->ids($shopIds))->get(['id', 'name']);
        $figures = $this->overview()->figures($shops, $dateRange['start'], $dateRange['end'], withSnapshot: false);

        return $shops->map(fn ($shop) => [
            'id' => $shop->id,
            'name' => $shop->name,
            'salesCount' => $figures[$shop->id]['count'],
            'revenue' => $figures[$shop->id]['revenue'],
        ])->sortByDesc('revenue')->values()->all();
    }

    private function getCurrencySymbol(string $currency): string
    {
        return match($currency) {
            'XOF', 'XAF' => 'FCFA',
            'EUR' => '€',
            'USD' => '$',
            'GBP' => '£',
            'MAD' => 'DH',
            'TND' => 'DT',
            default => $currency,
        };
    }

    private function calcGrowth(float $v1, float $v2): float
    {
        return $v2 > 0 ? round((($v1 - $v2) / $v2) * 100, 1) : ($v1 > 0 ? 100.0 : 0.0);
    }

    private function getComparisonData($shopIds, string $mode, array $params): array
    {
        if ($mode === 'year') {
            return $this->getYearlyComparison($shopIds, $params['year1'], $params['year2']);
        } else {
            return $this->getMonthlyComparison($shopIds, $params['month1'], $params['month2'], $params['monthYear1'], $params['monthYear2']);
        }
    }

    private function getYearlyComparison($shopIds, int $year1, int $year2): array
    {
        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        // Deux séries d'un an jour par jour, puis regroupées par mois : la boucle lançait
        // six requêtes par mois.
        $daily = fn (int $year) => $this->overview()->daily(
            $this->ids($shopIds),
            Carbon::create($year, 1, 1)->startOfDay(),
            Carbon::create($year, 12, 31)->endOfDay(),
        );
        $byMonth = fn (array $days) => collect($days)
            ->groupBy(fn ($figures, $day) => (int) substr($day, 5, 2), preserveKeys: true)
            ->map(fn ($month) => $this->sumDays($month->all()));

        [$days1, $days2] = [$daily($year1), $daily($year2)];
        [$one, $two] = [$byMonth($days1), $byMonth($days2)];
        $chart = [];
        foreach ($months as $index => $label) {
            $month = $index + 1;
            $chart[] = [
                'label' => $label,
                'revenue1' => round($one[$month]['revenue'] ?? 0, 2),
                'revenue2' => round($two[$month]['revenue'] ?? 0, 2),
                'sales1' => $one[$month]['count'] ?? 0,
                'sales2' => $two[$month]['count'] ?? 0,
            ];
        }

        return [
            'mode' => 'year',
            'label1' => (string) $year1,
            'label2' => (string) $year2,
            'chart' => $chart,
            'totals' => $this->comparisonTotals($days1, $days2),
        ];
    }

    private function getMonthlyComparison($shopIds, int $month1, int $month2, int $year1, int $year2): array
    {
        $first1 = Carbon::create($year1, $month1, 1)->startOfDay();
        $first2 = Carbon::create($year2, $month2, 1)->startOfDay();
        $one = $this->overview()->daily($this->ids($shopIds), $first1, $first1->copy()->endOfMonth());
        $two = $this->overview()->daily($this->ids($shopIds), $first2, $first2->copy()->endOfMonth());

        $chart = [];
        for ($day = 1; $day <= max($first1->daysInMonth, $first2->daysInMonth); $day++) {
            $key1 = $first1->copy()->day($day)->toDateString();
            $key2 = $first2->copy()->day($day)->toDateString();
            $chart[] = [
                'label' => str_pad((string) $day, 2, '0', STR_PAD_LEFT),
                'revenue1' => $day <= $first1->daysInMonth ? round($one[$key1]['revenue'] ?? 0, 2) : 0,
                'revenue2' => $day <= $first2->daysInMonth ? round($two[$key2]['revenue'] ?? 0, 2) : 0,
                'sales1' => $day <= $first1->daysInMonth ? ($one[$key1]['count'] ?? 0) : 0,
                'sales2' => $day <= $first2->daysInMonth ? ($two[$key2]['count'] ?? 0) : 0,
            ];
        }

        return [
            'mode' => 'month',
            'label1' => $first1->isoFormat('MMMM YYYY'),
            'label2' => $first2->isoFormat('MMMM YYYY'),
            'chart' => $chart,
            'totals' => $this->comparisonTotals($one, $two),
        ];
    }

    /** CA, ventes et bénéfice (la marge brute) des deux périodes comparées. */
    private function comparisonTotals(array $one, array $two): array
    {
        $a = $this->sumDays($one);
        $b = $this->sumDays($two);
        $profitA = $a['net'] - $a['cost'];
        $profitB = $b['net'] - $b['cost'];

        return [
            'revenue' => ['v1' => round($a['revenue'], 2), 'v2' => round($b['revenue'], 2), 'growth' => $this->calcGrowth($a['revenue'], $b['revenue'])],
            'sales' => ['v1' => $a['count'], 'v2' => $b['count'], 'growth' => $this->calcGrowth($a['count'], $b['count'])],
            'profit' => ['v1' => round($profitA, 2), 'v2' => round($profitB, 2), 'growth' => $this->calcGrowth($profitA, $profitB)],
        ];
    }
}
