<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Shop;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Rediriger les caissiers vers la page de ventes (pas accès aux analytics)
        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            return redirect()->route('sales.create', ['code_user' => $request->route('code_user')]);
        }

        $shops = Shop::where('user_id', $user->id)->get();
        $shopIds = $shops->pluck('id');
        $activeShopId = session('active_shop_id');

        // Si une boutique active est sélectionnée, filtrer sur celle-ci
        $filterShopIds = $activeShopId ? [$activeShopId] : $shopIds;

        // Période sélectionnée
        $period = $request->get('period', 'month');
        $dateRange = $this->getDateRange($period);
        $previousRange = $this->getPreviousDateRange($period);

        // KPIs principaux
        $kpis = $this->getKPIs($filterShopIds, $dateRange, $previousRange);

        // Données du graphique des ventes
        $salesChart = $this->getSalesChart($filterShopIds, $period);

        // Top produits
        $topProducts = $this->getTopProducts($filterShopIds, $dateRange);

        // Ventes par catégorie
        $salesByCategory = $this->getSalesByCategory($filterShopIds, $dateRange);

        // Top clients
        $topCustomers = $this->getTopCustomers($filterShopIds, $dateRange);

        // Méthodes de paiement
        $paymentMethods = $this->getPaymentMethods($filterShopIds, $dateRange);

        // Performance par boutique
        $shopPerformance = $this->getShopPerformance($shopIds, $dateRange);

        // Paramètres de comparaison
        $compareMode = $request->get('compare_mode', 'year');
        $year1 = (int) $request->get('year1', date('Y'));
        $year2 = (int) $request->get('year2', date('Y') - 1);
        $month1 = (int) $request->get('month1', date('n'));
        $month2 = (int) $request->get('month2', date('n'));
        $monthYear1 = (int) $request->get('month_year1', date('Y'));
        $monthYear2 = (int) $request->get('month_year2', date('Y') - 1);

        // Données de comparaison
        $comparisonData = $this->getComparisonData($filterShopIds, $compareMode, compact(
            'year1', 'year2', 'month1', 'month2', 'monthYear1', 'monthYear2'
        ));

        // Récupérer le symbole de devise
        $currencySymbol = 'FCFA';
        if ($activeShopId) {
            $activeShop = $shops->find($activeShopId);
            if ($activeShop) {
                $currencySymbol = $this->getCurrencySymbol($activeShop->currency ?? 'XOF');
            }
        }

        return Inertia::render('Analytics/Index', [
            'kpis' => $kpis,
            'salesChart' => $salesChart,
            'topProducts' => $topProducts,
            'salesByCategory' => $salesByCategory,
            'topCustomers' => $topCustomers,
            'paymentMethods' => $paymentMethods,
            'shopPerformance' => $shopPerformance,
            'comparisonData' => $comparisonData,
            'currentPeriod' => $period,
            'currencySymbol' => $currencySymbol,
            'shops' => $shops->map(fn($shop) => [
                'id' => $shop->id,
                'name' => $shop->name,
            ]),
            'activeShopId' => $activeShopId,
        ]);
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
    
    private function getKPIs($shopIds, array $dateRange, array $previousRange): array
    {
        // CA période actuelle
        $currentRevenue = Sale::whereIn('shop_id', $shopIds)
            ->whereBetween('sale_date', [$dateRange['start'], $dateRange['end']])
            ->where('status', 'completed')
            ->sum('total');
        
        // CA période précédente
        $previousRevenue = Sale::whereIn('shop_id', $shopIds)
            ->whereBetween('sale_date', [$previousRange['start'], $previousRange['end']])
            ->where('status', 'completed')
            ->sum('total');
        
        $revenueGrowth = $previousRevenue > 0 
            ? round((($currentRevenue - $previousRevenue) / $previousRevenue) * 100, 1)
            : ($currentRevenue > 0 ? 100 : 0);
        
        // Nombre de ventes
        $currentSalesCount = Sale::whereIn('shop_id', $shopIds)
            ->whereBetween('sale_date', [$dateRange['start'], $dateRange['end']])
            ->where('status', 'completed')
            ->count();
        
        $previousSalesCount = Sale::whereIn('shop_id', $shopIds)
            ->whereBetween('sale_date', [$previousRange['start'], $previousRange['end']])
            ->where('status', 'completed')
            ->count();
        
        $salesCountGrowth = $previousSalesCount > 0 
            ? round((($currentSalesCount - $previousSalesCount) / $previousSalesCount) * 100, 1)
            : ($currentSalesCount > 0 ? 100 : 0);
        
        // Panier moyen
        $avgBasket = $currentSalesCount > 0 ? $currentRevenue / $currentSalesCount : 0;
        $previousAvgBasket = $previousSalesCount > 0 ? $previousRevenue / $previousSalesCount : 0;
        
        $avgBasketGrowth = $previousAvgBasket > 0 
            ? round((($avgBasket - $previousAvgBasket) / $previousAvgBasket) * 100, 1)
            : ($avgBasket > 0 ? 100 : 0);
        
        // Marge brute (calculée depuis le prix d'achat des produits)
        $currentMargin = SaleItem::select(DB::raw('SUM((sale_items.unit_price - COALESCE(products.purchase_price, 0)) * sale_items.quantity) as margin'))
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereHas('sale', function($q) use ($shopIds, $dateRange) {
                $q->whereIn('shop_id', $shopIds)
                  ->whereBetween('sale_date', [$dateRange['start'], $dateRange['end']])
                  ->where('status', 'completed');
            })
            ->value('margin') ?? 0;
        
        $marginRate = $currentRevenue > 0 ? round(($currentMargin / $currentRevenue) * 100, 1) : 0;
        
        // Nouveaux clients
        $newCustomers = Customer::whereIn('shop_id', $shopIds)
            ->whereBetween('created_at', [$dateRange['start'], $dateRange['end']])
            ->count();
        
        return [
            'revenue' => [
                'value' => (float) $currentRevenue,
                'growth' => $revenueGrowth,
                'previousValue' => (float) $previousRevenue,
            ],
            'salesCount' => [
                'value' => $currentSalesCount,
                'growth' => $salesCountGrowth,
                'previousValue' => $previousSalesCount,
            ],
            'avgBasket' => [
                'value' => round($avgBasket, 0),
                'growth' => $avgBasketGrowth,
                'previousValue' => round($previousAvgBasket, 0),
            ],
            'marginRate' => [
                'value' => $marginRate,
                'margin' => (float) $currentMargin,
            ],
            'newCustomers' => [
                'value' => $newCustomers,
            ],
        ];
    }
    
    private function getSalesChart($shopIds, string $period): array
    {
        $data = [];
        $now = Carbon::now();
        
        switch ($period) {
            case 'today':
                // Par heure
                for ($i = 0; $i < 24; $i++) {
                    $hour = $now->copy()->startOfDay()->addHours($i);
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereBetween('sale_date', [$hour, $hour->copy()->endOfHour()])
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => $hour->format('H:00'),
                        'value' => (float) $total,
                    ];
                }
                break;
                
            case 'week':
                // Par jour
                for ($i = 0; $i < 7; $i++) {
                    $day = $now->copy()->startOfWeek()->addDays($i);
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereDate('sale_date', $day)
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => $day->isoFormat('ddd D'),
                        'value' => (float) $total,
                    ];
                }
                break;
                
            case 'month':
                // Par semaine
                $startOfMonth = $now->copy()->startOfMonth();
                $endOfMonth = $now->copy()->endOfMonth();
                $weekNum = 1;
                
                while ($startOfMonth <= $endOfMonth) {
                    $weekEnd = $startOfMonth->copy()->endOfWeek();
                    if ($weekEnd > $endOfMonth) $weekEnd = $endOfMonth->copy();
                    
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereBetween('sale_date', [$startOfMonth, $weekEnd])
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => "Sem. {$weekNum}",
                        'value' => (float) $total,
                    ];
                    
                    $startOfMonth = $weekEnd->copy()->addDay()->startOfDay();
                    $weekNum++;
                }
                break;
                
            case 'quarter':
            case 'year':
                // Par mois
                $months = $period === 'quarter' ? 3 : 12;
                $start = $period === 'quarter' 
                    ? $now->copy()->startOfQuarter() 
                    : $now->copy()->startOfYear();
                
                for ($i = 0; $i < $months; $i++) {
                    $month = $start->copy()->addMonths($i);
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereBetween('sale_date', [$month->startOfMonth(), $month->copy()->endOfMonth()])
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => $month->isoFormat('MMM'),
                        'value' => (float) $total,
                    ];
                }
                break;
        }
        
        return $data;
    }
    
    private function getTopProducts($shopIds, array $dateRange, int $limit = 10): array
    {
        return SaleItem::select(
                'product_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(total) as total_revenue')
            )
            ->whereHas('sale', function($q) use ($shopIds, $dateRange) {
                $q->whereIn('shop_id', $shopIds)
                  ->whereBetween('sale_date', [$dateRange['start'], $dateRange['end']])
                  ->where('status', 'completed');
            })
            ->with('product:id,name,sku,image')
            ->groupBy('product_id')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get()
            ->map(fn($item) => [
                'id' => $item->product_id,
                'name' => $item->product->name ?? 'Produit supprimé',
                'sku' => $item->product->sku ?? '-',
                'image' => $item->product->image ?? null,
                'quantity' => (int) $item->total_quantity,
                'revenue' => (float) $item->total_revenue,
            ])
            ->toArray();
    }
    
    private function getSalesByCategory($shopIds, array $dateRange): array
    {
        $results = SaleItem::select(
                'products.category_id',
                DB::raw('SUM(sale_items.total) as total_revenue')
            )
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereHas('sale', function($q) use ($shopIds, $dateRange) {
                $q->whereIn('shop_id', $shopIds)
                  ->whereBetween('sale_date', [$dateRange['start'], $dateRange['end']])
                  ->where('status', 'completed');
            })
            ->groupBy('products.category_id')
            ->orderByDesc('total_revenue')
            ->limit(8)
            ->get();
        
        $categories = Category::whereIn('id', $results->pluck('category_id'))->pluck('name', 'id');
        $total = $results->sum('total_revenue');
        
        return $results->map(fn($item) => [
            'name' => $categories[$item->category_id] ?? 'Sans catégorie',
            'revenue' => (float) $item->total_revenue,
            'percentage' => $total > 0 ? round(($item->total_revenue / $total) * 100, 1) : 0,
        ])->toArray();
    }
    
    private function getTopCustomers($shopIds, array $dateRange, int $limit = 10): array
    {
        return Sale::select(
                'customer_id',
                DB::raw('COUNT(*) as sales_count'),
                DB::raw('SUM(total) as total_spent')
            )
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('sale_date', [$dateRange['start'], $dateRange['end']])
            ->where('status', 'completed')
            ->whereNotNull('customer_id')
            ->with('customer:id,name,email,phone')
            ->groupBy('customer_id')
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->get()
            ->map(fn($item) => [
                'id' => $item->customer_id,
                'name' => $item->customer->name ?? 'Client supprimé',
                'email' => $item->customer->email ?? '',
                'phone' => $item->customer->phone ?? '',
                'salesCount' => (int) $item->sales_count,
                'totalSpent' => (float) $item->total_spent,
            ])
            ->toArray();
    }
    
    private function getPaymentMethods($shopIds, array $dateRange): array
    {
        $results = Sale::select(
                'payment_method',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total) as total')
            )
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('sale_date', [$dateRange['start'], $dateRange['end']])
            ->where('status', 'completed')
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->get();
        
        $grandTotal = $results->sum('total');
        
        $labels = [
            'cash' => 'Espèces',
            'card' => 'Carte bancaire',
            'mobile_money' => 'Mobile Money',
            'transfer' => 'Virement',
            'check' => 'Chèque',
            'credit' => 'Crédit',
        ];
        
        return $results->map(fn($item) => [
            'method' => $labels[$item->payment_method] ?? $item->payment_method,
            'count' => (int) $item->count,
            'total' => (float) $item->total,
            'percentage' => $grandTotal > 0 ? round(($item->total / $grandTotal) * 100, 1) : 0,
        ])->toArray();
    }
    
    private function getShopPerformance($shopIds, array $dateRange): array
    {
        return Sale::select(
                'shop_id',
                DB::raw('COUNT(*) as sales_count'),
                DB::raw('SUM(total) as total_revenue')
            )
            ->whereIn('shop_id', $shopIds)
            ->whereBetween('sale_date', [$dateRange['start'], $dateRange['end']])
            ->where('status', 'completed')
            ->with('shop:id,name')
            ->groupBy('shop_id')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(fn($item) => [
                'id' => $item->shop_id,
                'name' => $item->shop->name ?? 'Boutique supprimée',
                'salesCount' => (int) $item->sales_count,
                'revenue' => (float) $item->total_revenue,
            ])
            ->toArray();
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
        $chart = [];

        $totalRevenue1 = 0;
        $totalRevenue2 = 0;
        $totalSales1 = 0;
        $totalSales2 = 0;
        $totalProfit1 = 0;
        $totalProfit2 = 0;

        for ($i = 1; $i <= 12; $i++) {
            $revenue1 = (float) Sale::whereIn('shop_id', $shopIds)
                ->whereYear('sale_date', $year1)
                ->whereMonth('sale_date', $i)
                ->where('status', 'completed')
                ->sum('total');

            $revenue2 = (float) Sale::whereIn('shop_id', $shopIds)
                ->whereYear('sale_date', $year2)
                ->whereMonth('sale_date', $i)
                ->where('status', 'completed')
                ->sum('total');

            $sales1 = Sale::whereIn('shop_id', $shopIds)
                ->whereYear('sale_date', $year1)
                ->whereMonth('sale_date', $i)
                ->where('status', 'completed')
                ->count();

            $sales2 = Sale::whereIn('shop_id', $shopIds)
                ->whereYear('sale_date', $year2)
                ->whereMonth('sale_date', $i)
                ->where('status', 'completed')
                ->count();

            $profit1 = (float) (SaleItem::select(DB::raw('SUM((sale_items.unit_price - COALESCE(products.purchase_price, 0)) * sale_items.quantity) as p'))
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->whereHas('sale', function($q) use ($shopIds, $year1, $i) {
                    $q->whereIn('shop_id', $shopIds)
                      ->whereYear('sale_date', $year1)
                      ->whereMonth('sale_date', $i)
                      ->where('status', 'completed');
                })
                ->value('p') ?? 0);

            $profit2 = (float) (SaleItem::select(DB::raw('SUM((sale_items.unit_price - COALESCE(products.purchase_price, 0)) * sale_items.quantity) as p'))
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->whereHas('sale', function($q) use ($shopIds, $year2, $i) {
                    $q->whereIn('shop_id', $shopIds)
                      ->whereYear('sale_date', $year2)
                      ->whereMonth('sale_date', $i)
                      ->where('status', 'completed');
                })
                ->value('p') ?? 0);

            $chart[] = [
                'label' => $months[$i - 1],
                'revenue1' => $revenue1,
                'revenue2' => $revenue2,
                'sales1' => $sales1,
                'sales2' => $sales2,
            ];

            $totalRevenue1 += $revenue1;
            $totalRevenue2 += $revenue2;
            $totalSales1 += $sales1;
            $totalSales2 += $sales2;
            $totalProfit1 += $profit1;
            $totalProfit2 += $profit2;
        }

        return [
            'mode' => 'year',
            'label1' => (string) $year1,
            'label2' => (string) $year2,
            'chart' => $chart,
            'totals' => [
                'revenue' => [
                    'v1' => $totalRevenue1,
                    'v2' => $totalRevenue2,
                    'growth' => $this->calcGrowth($totalRevenue1, $totalRevenue2),
                ],
                'sales' => [
                    'v1' => $totalSales1,
                    'v2' => $totalSales2,
                    'growth' => $this->calcGrowth($totalSales1, $totalSales2),
                ],
                'profit' => [
                    'v1' => $totalProfit1,
                    'v2' => $totalProfit2,
                    'growth' => $this->calcGrowth($totalProfit1, $totalProfit2),
                ],
            ],
        ];
    }

    private function getMonthlyComparison($shopIds, int $month1, int $month2, int $year1, int $year2): array
    {
        $daysInMonth1 = Carbon::createFromDate($year1, $month1, 1)->daysInMonth;
        $daysInMonth2 = Carbon::createFromDate($year2, $month2, 1)->daysInMonth;
        $maxDays = max($daysInMonth1, $daysInMonth2);

        $chart = [];
        $totalRevenue1 = 0;
        $totalRevenue2 = 0;
        $totalSales1 = 0;
        $totalSales2 = 0;
        $totalProfit1 = 0;
        $totalProfit2 = 0;

        for ($day = 1; $day <= $maxDays; $day++) {
            $label = str_pad($day, 2, '0', STR_PAD_LEFT);

            // Mois 1
            $revenue1 = 0;
            $sales1 = 0;
            $profit1 = 0;
            if ($day <= $daysInMonth1) {
                $date1 = Carbon::createFromDate($year1, $month1, $day);
                $revenue1 = (float) Sale::whereIn('shop_id', $shopIds)
                    ->whereDate('sale_date', $date1)
                    ->where('status', 'completed')
                    ->sum('total');

                $sales1 = Sale::whereIn('shop_id', $shopIds)
                    ->whereDate('sale_date', $date1)
                    ->where('status', 'completed')
                    ->count();

                $profit1 = (float) (SaleItem::select(DB::raw('SUM((sale_items.unit_price - COALESCE(products.purchase_price, 0)) * sale_items.quantity) as p'))
                    ->join('products', 'sale_items.product_id', '=', 'products.id')
                    ->whereHas('sale', function($q) use ($shopIds, $date1) {
                        $q->whereIn('shop_id', $shopIds)
                          ->whereDate('sale_date', $date1)
                          ->where('status', 'completed');
                    })
                    ->value('p') ?? 0);
            }

            // Mois 2
            $revenue2 = 0;
            $sales2 = 0;
            $profit2 = 0;
            if ($day <= $daysInMonth2) {
                $date2 = Carbon::createFromDate($year2, $month2, $day);
                $revenue2 = (float) Sale::whereIn('shop_id', $shopIds)
                    ->whereDate('sale_date', $date2)
                    ->where('status', 'completed')
                    ->sum('total');

                $sales2 = Sale::whereIn('shop_id', $shopIds)
                    ->whereDate('sale_date', $date2)
                    ->where('status', 'completed')
                    ->count();

                $profit2 = (float) (SaleItem::select(DB::raw('SUM((sale_items.unit_price - COALESCE(products.purchase_price, 0)) * sale_items.quantity) as p'))
                    ->join('products', 'sale_items.product_id', '=', 'products.id')
                    ->whereHas('sale', function($q) use ($shopIds, $date2) {
                        $q->whereIn('shop_id', $shopIds)
                          ->whereDate('sale_date', $date2)
                          ->where('status', 'completed');
                    })
                    ->value('p') ?? 0);
            }

            $chart[] = [
                'label' => $label,
                'revenue1' => $revenue1,
                'revenue2' => $revenue2,
                'sales1' => $sales1,
                'sales2' => $sales2,
            ];

            $totalRevenue1 += $revenue1;
            $totalRevenue2 += $revenue2;
            $totalSales1 += $sales1;
            $totalSales2 += $sales2;
            $totalProfit1 += $profit1;
            $totalProfit2 += $profit2;
        }

        $label1 = Carbon::createFromDate($year1, $month1, 1)->isoFormat('MMMM YYYY');
        $label2 = Carbon::createFromDate($year2, $month2, 1)->isoFormat('MMMM YYYY');

        return [
            'mode' => 'month',
            'label1' => $label1,
            'label2' => $label2,
            'chart' => $chart,
            'totals' => [
                'revenue' => [
                    'v1' => $totalRevenue1,
                    'v2' => $totalRevenue2,
                    'growth' => $this->calcGrowth($totalRevenue1, $totalRevenue2),
                ],
                'sales' => [
                    'v1' => $totalSales1,
                    'v2' => $totalSales2,
                    'growth' => $this->calcGrowth($totalSales1, $totalSales2),
                ],
                'profit' => [
                    'v1' => $totalProfit1,
                    'v2' => $totalProfit2,
                    'growth' => $this->calcGrowth($totalProfit1, $totalProfit2),
                ],
            ],
        ];
    }
}
