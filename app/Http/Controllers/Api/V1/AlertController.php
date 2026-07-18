<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Alertes actives (non lues) d'une boutique — ruptures de stock, crédits en retard,
 * précommandes prêtes, etc. Lecture seule, consommé par l'assistant IA via le MCP.
 */
class AlertController extends Controller
{
    use ScopesToAccessibleShops;

    public function index(Request $request): JsonResponse
    {
        $limit = min(max((int) $request->query('per_page', 20), 1), 100);

        $alerts = Alert::whereIn('shop_id', $this->resolveShopIds($request))
            ->where('is_read', false)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(['id', 'shop_id', 'type', 'title', 'message', 'related_type', 'related_id', 'created_at']);

        return response()->json(['data' => $alerts]);
    }
}
