<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoints d'analyse (lecture seule) consommés par l'assistant IA via le MCP.
 * Le scoping tenant passe par le trait partagé : `resolveShopIds()` restreint aux
 * boutiques accessibles au token (et abort 403 sur un `shop_id` non autorisé).
 */
class AnalyticsController extends Controller
{
    use ScopesToAccessibleShops;

    /**
     * KPIs de ventes sur une période glissante : CA, nombre de ventes, panier moyen.
     */
    public function salesSummary(Request $request): JsonResponse
    {
        $days = min(max((int) $request->query('days', 30), 1), 365);
        $startDate = now()->subDays($days)->startOfDay();

        $sales = Sale::whereIn('shop_id', $this->resolveShopIds($request))
            ->where('status', 'completed')
            ->where('sale_date', '>=', $startDate)
            ->get(['total']);

        $saleCount = $sales->count();
        $totalRevenue = (float) $sales->sum('total');

        return response()->json([
            'data' => [
                'period_days' => $days,
                'total_revenue' => round($totalRevenue, 2),
                'sale_count' => $saleCount,
                'average_basket' => $saleCount > 0 ? round($totalRevenue / $saleCount, 2) : 0,
                'currency' => 'XOF',
            ],
        ]);
    }

    /**
     * Meilleurs produits par chiffre d'affaires généré sur la période.
     */
    public function topProducts(Request $request): JsonResponse
    {
        $limit = min(max((int) $request->query('limit', 10), 1), 50);
        $days = min(max((int) $request->query('days', 30), 1), 365);
        $startDate = now()->subDays($days)->startOfDay();

        // Colonnes qualifiées : `sales` et `products` portent tous deux `shop_id`.
        $topProducts = Sale::whereIn('sales.shop_id', $this->resolveShopIds($request))
            ->where('sales.status', 'completed')
            ->where('sales.sale_date', '>=', $startDate)
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select('products.id', 'products.name')
            ->selectRaw('SUM(sale_items.quantity * sale_items.unit_price) as revenue')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();

        return response()->json(['data' => $topProducts]);
    }
}
