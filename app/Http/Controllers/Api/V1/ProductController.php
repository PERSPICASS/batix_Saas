<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Api\V1\Concerns\SearchesText;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreProductApiRequest;
use App\Http\Requests\Api\V1\UpdateProductApiRequest;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use App\Services\ActivityLogger;
use App\Services\ProductCreationService;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    use ScopesToAccessibleShops;
    use SearchesText;

    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::whereIn('shop_id', $this->resolveShopIds($request))
            ->with('category')
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            // `brand` est indispensable : le nom du produit ne porte pas la marque
            // (« Pistolet à peinture électrique 600W » / « Tolsen »), l'API la renvoie,
            // donc l'assistant la cite — mais chercher « Tolsen » ne trouvait rien.
            ->when($request->filled('search'), fn ($q) => $this->applyTextSearch(
                $q,
                ['name', 'brand', 'sku'],
                $request->query('search'),
            ))
            ->orderByDesc('updated_at')
            ->paginate($this->resolvePerPage($request));

        return ProductResource::collection($products);
    }

    public function show(Request $request, Product $product): ProductResource
    {
        abort_unless(in_array($product->shop_id, $this->resolveShopIds($request), true), 404);

        return new ProductResource($product->load('category'));
    }

    public function store(StoreProductApiRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        // Aborts with 403 if shop_id isn't one of the token's accessible shops.
        $this->resolveShopIds($request);

        $shop = $request->user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);

        $product = (new ProductCreationService())->create($validated, $shop);

        ActivityLogger::created($product, $product->name);

        return (new ProductResource($product->load('category')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductApiRequest $request, Product $product): ProductResource
    {
        abort_unless(in_array($product->shop_id, $this->resolveShopIds($request), true), 404);

        $validated = $request->validated();

        $oldStock = $product->stock_quantity;
        $newStock = (int) ($validated['stock_quantity'] ?? $oldStock);

        $updateData = collect($validated)->except(['stock_quantity'])->toArray();

        DB::transaction(function () use ($product, $updateData, $oldStock, $newStock) {
            $product->update($updateData);

            if ($newStock !== $oldStock) {
                StockMovementService::recordManualAdjustment(
                    $product,
                    $newStock - $oldStock,
                    'adjustment',
                    $product->shop_id,
                    "Correction manuelle via API (ancienne valeur: {$oldStock}, nouvelle: {$newStock})"
                );
            }
        });

        ActivityLogger::updated($product, [], $product->name);

        return new ProductResource($product->load('category'));
    }
}
