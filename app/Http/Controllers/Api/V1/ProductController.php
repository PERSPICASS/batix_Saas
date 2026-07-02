<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreProductApiRequest;
use App\Http\Requests\Api\V1\UpdateProductApiRequest;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use App\Services\ActivityLogger;
use App\Services\ProductCreationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    use ScopesToAccessibleShops;

    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::whereIn('shop_id', $this->resolveShopIds($request))
            ->with('category')
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($request->filled('search'), fn ($q) => $q->where(function ($q) use ($request) {
                $term = $request->query('search');
                $q->where('name', 'like', "%{$term}%")->orWhere('sku', 'like', "%{$term}%");
            }))
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

        $product->update($request->validated());

        ActivityLogger::updated($product, [], $product->name);

        return new ProductResource($product->load('category'));
    }
}
