<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Services\ShopsOverview;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Rediriger les caissiers vers la page de ventes
        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            return redirect()->route('sales.create', ['code_user' => $request->route('code_user')]);
        }
        
        $shops = Shop::where('user_id', $user->id)->get();
        $shopIds = $shops->pluck('id');
        $activeShopId = session('active_shop_id');
        
        // Si une boutique active est sélectionnée, filtrer sur celle-ci
        $filterShopIds = $activeShopId ? [$activeShopId] : $shopIds;
        
        // Période par défaut
        $period = $request->get('period', 'week');
        
        // Statistiques
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        
        // CA du jour et d'hier, avec les définitions de « Mes boutiques » (ShopsOverview) :
        // crédit compris, annulées exclues, factures émises, avoirs déduits. Ce tableau de bord
        // ne comptait que les ventes terminées, donc pas une vente à crédit encore due.
        $overview = app(ShopsOverview::class);
        $filterIds = collect($filterShopIds)->map(fn ($id) => (int) $id)->all();
        $byDay = $overview->daily($filterIds, $today->copy()->subDay(), $today->copy()->endOfDay());
        $todaySales = $byDay[$today->toDateString()]['revenue'] ?? 0;
        $yesterdaySales = $byDay[$today->copy()->subDay()->toDateString()]['revenue'] ?? 0;
        
        // Tendance CA
        $salesTrend = $yesterdaySales > 0 
            ? round((($todaySales - $yesterdaySales) / $yesterdaySales) * 100, 1)
            : ($todaySales > 0 ? 100 : 0);
        
        // Boutiques actives
        $activeShops = $shops->where('is_active', true)->count();
        $totalShops = $shops->count();
        
        // Produits en stock
        $productsInStock = Product::whereIn('shop_id', $filterShopIds)
            ->where('is_active', true)
            ->where('stock_quantity', '>', 0)
            ->count();
        
        // Nouveaux produits cette semaine
        $newProductsThisWeek = Product::whereIn('shop_id', $filterShopIds)
            ->where('created_at', '>=', $startOfWeek)
            ->count();
        
        // Alertes stock bas
        $lowStockAlerts = Product::whereIn('shop_id', $filterShopIds)
            ->where('is_active', true)
            ->where('track_stock', true)
            ->whereColumn('stock_quantity', '<=', 'min_stock_alert')
            ->count();
        
        // Données de performance selon la période
        $performanceData = $this->getPerformanceData($filterIds, $period, $overview);
        
        // Activités récentes
        $recentActivities = $this->getRecentActivities($filterShopIds);
        
        // Récupérer le symbole de devise de la boutique active
        $currencySymbol = 'FCFA';
        if ($activeShopId) {
            $activeShop = $shops->find($activeShopId);
            if ($activeShop) {
                $currencySymbol = $this->getCurrencySymbol($activeShop->currency ?? 'XOF');
            }
        }
        
        $totalProducts = Product::whereIn('shop_id', $shopIds)->count();
        // Une vente à crédit est une vente : l'étape d'accueil ne doit pas la réclamer encore.
        $totalSales    = Sale::whereIn('shop_id', $shopIds)->where('status', '!=', 'cancelled')->count();

        $onboarding = [
            'has_shop'     => $totalShops > 0,
            'has_product'  => $totalProducts > 0,
            'has_sale'     => $totalSales > 0,
            'is_complete'  => $totalShops > 0 && $totalProducts > 0 && $totalSales > 0,
        ];

        return Inertia::render('Dashboard', [
            'stats' => [
                'todaySales' => (float) $todaySales,
                'salesTrend' => $salesTrend,
                'activeShops' => $activeShops,
                'totalShops' => $totalShops,
                'productsInStock' => $productsInStock,
                'newProductsThisWeek' => $newProductsThisWeek,
                'lowStockAlerts' => $lowStockAlerts,
            ],
            'performanceData' => $performanceData,
            'currentPeriod' => $period,
            'recentActivities' => $recentActivities,
            'currencySymbol' => $currencySymbol,
            'onboarding' => $onboarding,
        ]);
    }
    
    /**
     * Récupérer les données de performance selon la période
     */
    private function getPerformanceData(array $shopIds, string $period, ShopsOverview $overview): array
    {
        $data = [];
        $today = Carbon::today();

        // Une seule série (heure par heure pour « 24 h », sinon jour par jour), découpée
        // ensuite en barres : la boucle lançait une requête par barre, sur les seules
        // ventes terminées.
        if ($period === 'day') {
            $hours = $overview->hourly($shopIds, Carbon::now()->subHours(23)->startOfHour(), Carbon::now()->endOfHour());
            for ($i = 23; $i >= 0; $i--) {
                $hour = Carbon::now()->subHours($i);
                $data[] = [
                    'label' => $hour->format('H:00'),
                    'shortLabel' => $hour->format('H') . 'h',
                    'total' => round($hours[$hour->format('Y-m-d H')] ?? 0, 2),
                ];
            }
        } else {
            $buckets = match ($period) {
                'week' => collect(range(6, 0))->map(fn ($i) => [
                    $today->copy()->subDays($i), $today->copy()->subDays($i)->endOfDay(),
                    $today->copy()->subDays($i)->isoFormat('ddd D'), $today->copy()->subDays($i)->isoFormat('ddd'),
                ]),
                'month' => collect(range(3, 0))->map(function ($i) use ($today) {
                    $start = $today->copy()->subWeeks($i)->startOfWeek();

                    return [$start, $start->copy()->endOfWeek(), 'Sem. ' . $start->weekOfYear, 'S' . $start->weekOfYear];
                }),
                default => collect(range(['quarter' => 2, 'semester' => 5, 'year' => 11][$period] ?? 11, 0))->map(function ($i) use ($today, $period) {
                    $month = $today->copy()->subMonthsNoOverflow($i);

                    return [
                        $month->copy()->startOfMonth(), $month->copy()->endOfMonth(),
                        $month->isoFormat(['quarter' => 'MMMM', 'semester' => 'MMMM YYYY'][$period] ?? 'MMM YYYY'),
                        $month->isoFormat('MMM'),
                    ];
                }),
            };

            $days = $overview->daily($shopIds, $buckets->first()[0], $buckets->last()[1]);
            foreach ($buckets as [$start, $end, $label, $shortLabel]) {
                $total = collect($days)
                    ->filter(fn ($figures, $day) => $day >= $start->toDateString() && $day <= $end->toDateString())
                    ->sum('revenue');
                $data[] = ['label' => $label, 'shortLabel' => $shortLabel, 'total' => round($total, 2)];
            }
        }
        
        // Calculer le max et les pourcentages
        $maxTotal = max(array_column($data, 'total')) ?: 1;
        $periodTotal = array_sum(array_column($data, 'total'));
        
        foreach ($data as &$item) {
            $item['percentage'] = $maxTotal > 0 ? round(($item['total'] / $maxTotal) * 100) : 0;
        }
        
        return [
            'items' => $data,
            'total' => $periodTotal,
            'periodLabel' => $this->getPeriodLabel($period),
        ];
    }
    
    private function getPeriodLabel(string $period): string
    {
        return match($period) {
            'day' => 'Aujourd\'hui (par heure)',
            'week' => '7 derniers jours',
            'month' => '4 dernières semaines',
            'quarter' => '3 derniers mois',
            'semester' => '6 derniers mois',
            'year' => '12 derniers mois',
            default => 'Période',
        };
    }
    
    private function getRecentActivities(array|\Illuminate\Support\Collection $shopIds): array
    {
        $activities = [];
        
        // Dernières ventes
        $recentSales = Sale::whereIn('shop_id', $shopIds)
            ->with(['shop', 'user'])
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get();
        
        foreach ($recentSales as $sale) {
            $activities[] = [
                'type' => 'sale',
                'title' => 'Nouvelle vente',
                'description' => "Ticket {$sale->ticket_number} - " . number_format($sale->total, 0, ',', ' ') . " FCFA",
                'shop' => $sale->shop->name ?? '',
                'time' => $sale->created_at,
            ];
        }
        
        // Alertes de stock bas
        $lowStockProducts = Product::whereIn('shop_id', $shopIds)
            ->where('track_stock', true)
            ->whereColumn('stock_quantity', '<=', 'min_stock_alert')
            ->with('shop')
            ->orderBy('updated_at', 'desc')
            ->take(3)
            ->get();
        
        foreach ($lowStockProducts as $product) {
            $activities[] = [
                'type' => 'low_stock',
                'title' => 'Rupture imminente',
                'description' => "{$product->name} - Stock: {$product->stock_quantity}",
                'shop' => $product->shop->name ?? '',
                'time' => $product->updated_at,
            ];
        }
        
        // Derniers mouvements de stock
        $recentMovements = StockMovement::whereIn('shop_id', $shopIds)
            ->with(['product', 'shop', 'user'])
            ->orderBy('created_at', 'desc')
            ->take(2)
            ->get();
        
        foreach ($recentMovements as $movement) {
            $typeLabel = match($movement->type) {
                'entry' => 'Entrée de stock',
                'exit' => 'Sortie de stock',
                'adjustment' => 'Ajustement de stock',
                'transfer' => 'Transfert de stock',
                default => 'Mouvement de stock',
            };
            
            $activities[] = [
                'type' => 'stock_movement',
                'title' => $typeLabel,
                'description' => "{$movement->product->name} - Qté: {$movement->quantity}",
                'shop' => $movement->shop->name ?? '',
                'time' => $movement->created_at,
            ];
        }
        
        // Trier par date et limiter
        usort($activities, fn($a, $b) => $b['time'] <=> $a['time']);
        
        // Formater les dates
        return array_map(function ($activity) {
            $activity['time'] = Carbon::parse($activity['time'])->diffForHumans();
            return $activity;
        }, array_slice($activities, 0, 5));
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
}
