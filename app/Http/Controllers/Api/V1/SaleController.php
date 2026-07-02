<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreSaleApiRequest;
use App\Http\Resources\Api\V1\SaleResource;
use App\Models\Sale;
use App\Services\ActivityLogger;
use App\Services\SaleCreationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SaleController extends Controller
{
    use ScopesToAccessibleShops;

    public function index(Request $request): AnonymousResourceCollection
    {
        $sales = Sale::whereIn('shop_id', $this->resolveShopIds($request))
            ->with('customer')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('since'), fn ($q) => $q->where('updated_at', '>', $request->query('since')))
            ->orderByDesc('sale_date')
            ->paginate($this->resolvePerPage($request));

        return SaleResource::collection($sales);
    }

    public function show(Request $request, Sale $sale): SaleResource
    {
        abort_unless(in_array($sale->shop_id, $this->resolveShopIds($request), true), 404);

        return new SaleResource($sale->load(['customer', 'items']));
    }

    /**
     * Crée une vente via le même SaleCreationService que le formulaire web —
     * totaux, statut crédit/complet et mouvements de stock identiques.
     */
    public function store(StoreSaleApiRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Aborts with 403 if shop_id isn't one of the token's accessible shops.
        $this->resolveShopIds($request);

        $shop = $request->user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        $validated['user_id'] = $request->user()->id;

        $sale = SaleCreationService::create($validated, $shop);

        ActivityLogger::created($sale, $sale->ticket_number);

        return (new SaleResource($sale->load(['customer', 'items'])))
            ->response()
            ->setStatusCode(201);
    }
}
