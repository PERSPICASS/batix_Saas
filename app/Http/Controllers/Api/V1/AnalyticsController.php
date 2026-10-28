<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Services\ShopReport;
use App\Services\ShopsOverview;
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
     *
     * Même définition que les écrans (ShopsOverview) : ventes au comptoir crédit compris,
     * retours au jour du retour, factures moins avoirs. Cet endpoint ne comptait que les
     * ventes « terminées » : l'assistant annonçait un CA sans les ventes à crédit, différent
     * de celui affiché à l'écran.
     */
    public function salesSummary(Request $request, ShopsOverview $overview): JsonResponse
    {
        $days = min(max((int) $request->query('days', 30), 1), 365);
        $byDay = collect($overview->daily($this->resolveShopIds($request), now()->subDays($days)->startOfDay(), now()->endOfDay()));

        $saleCount = (int) $byDay->sum('count');
        $totalRevenue = (float) $byDay->sum('revenue');

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
     * Meilleurs produits par chiffre d'affaires généré sur la période (TTC, retours et avoirs
     * déduits), comme le top produits de l'analytique (ShopReport::products).
     */
    public function topProducts(Request $request, ShopReport $report): JsonResponse
    {
        $limit = min(max((int) $request->query('limit', 10), 1), 50);
        $days = min(max((int) $request->query('days', 30), 1), 365);

        $topProducts = $report->products($this->resolveShopIds($request), now()->subDays($days)->startOfDay(), now()->endOfDay())
            ->filter(fn ($line) => $line['product_id'] !== null)
            ->sortByDesc('revenue')
            ->take($limit)
            ->map(fn ($line) => ['id' => $line['product_id'], 'name' => $line['name'], 'revenue' => $line['revenue']])
            ->values();

        return response()->json(['data' => $topProducts]);
    }
}
