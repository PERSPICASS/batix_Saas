<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
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
        
        // CA du jour
        $todaySales = Sale::whereIn('shop_id', $filterShopIds)
            ->whereDate('sale_date', $today)
            ->where('status', 'completed')
            ->sum('total');
        
        // CA d'hier pour comparer
        $yesterdaySales = Sale::whereIn('shop_id', $filterShopIds)
            ->whereDate('sale_date', $today->copy()->subDay())
            ->where('status', 'completed')
            ->sum('total');
        
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
        $performanceData = $this->getPerformanceData($filterShopIds, $period);
        
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
        $totalSales    = Sale::whereIn('shop_id', $shopIds)->where('status', 'completed')->count();

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
    private function getPerformanceData(array|\Illuminate\Support\Collection $shopIds, string $period): array
    {
        $data = [];
        $today = Carbon::today();
        
        switch ($period) {
            case 'day':
                // Performance par heure (dernières 24h)
                for ($i = 23; $i >= 0; $i--) {
                    $hour = Carbon::now()->subHours($i);
                    $hourStart = $hour->copy()->startOfHour();
                    $hourEnd = $hour->copy()->endOfHour();
                    
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereBetween('sale_date', [$hourStart, $hourEnd])
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => $hour->format('H:00'),
                        'shortLabel' => $hour->format('H') . 'h',
                        'total' => (float) $total,
                    ];
                }
                break;
                
            case 'week':
                // Performance par jour (7 derniers jours)
                for ($i = 6; $i >= 0; $i--) {
                    $date = $today->copy()->subDays($i);
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereDate('sale_date', $date)
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => $date->isoFormat('ddd D'),
                        'shortLabel' => $date->isoFormat('ddd'),
                        'total' => (float) $total,
                    ];
                }
                break;
                
            case 'month':
                // Performance par semaine (4 dernières semaines)
                for ($i = 3; $i >= 0; $i--) {
                    $weekStart = $today->copy()->subWeeks($i)->startOfWeek();
                    $weekEnd = $weekStart->copy()->endOfWeek();
                    
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereBetween('sale_date', [$weekStart, $weekEnd])
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => 'Sem. ' . $weekStart->weekOfYear,
                        'shortLabel' => 'S' . $weekStart->weekOfYear,
                        'total' => (float) $total,
                    ];
                }
                break;
                
            case 'quarter':
                // Performance par mois (3 derniers mois)
                for ($i = 2; $i >= 0; $i--) {
                    $month = $today->copy()->subMonths($i);
                    $monthStart = $month->copy()->startOfMonth();
                    $monthEnd = $month->copy()->endOfMonth();
                    
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereBetween('sale_date', [$monthStart, $monthEnd])
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => $month->isoFormat('MMMM'),
                        'shortLabel' => $month->isoFormat('MMM'),
                        'total' => (float) $total,
                    ];
                }
                break;
                
            case 'semester':
                // Performance par mois (6 derniers mois)
                for ($i = 5; $i >= 0; $i--) {
                    $month = $today->copy()->subMonths($i);
                    $monthStart = $month->copy()->startOfMonth();
                    $monthEnd = $month->copy()->endOfMonth();
                    
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereBetween('sale_date', [$monthStart, $monthEnd])
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => $month->isoFormat('MMMM YYYY'),
                        'shortLabel' => $month->isoFormat('MMM'),
                        'total' => (float) $total,
                    ];
                }
                break;
                
            case 'year':
                // Performance par mois (12 derniers mois)
                for ($i = 11; $i >= 0; $i--) {
                    $month = $today->copy()->subMonths($i);
                    $monthStart = $month->copy()->startOfMonth();
                    $monthEnd = $month->copy()->endOfMonth();
                    
                    $total = Sale::whereIn('shop_id', $shopIds)
                        ->whereBetween('sale_date', [$monthStart, $monthEnd])
                        ->where('status', 'completed')
                        ->sum('total');
                    
                    $data[] = [
                        'label' => $month->isoFormat('MMM YYYY'),
                        'shortLabel' => $month->isoFormat('MMM'),
                        'total' => (float) $total,
                    ];
                }
                break;
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
