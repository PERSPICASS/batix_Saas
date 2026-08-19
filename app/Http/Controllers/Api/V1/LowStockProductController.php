<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** État courant exhaustif des produits actifs sous leur seuil de stock. */
class LowStockProductController extends Controller
{
    use ScopesToAccessibleShops;

    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $products = Product::whereIn('shop_id', $this->resolveShopIds($request))
            ->with('category')
            ->where('is_active', true)
            ->where('track_stock', true)
            ->whereNotNull('min_stock_alert')
            ->where('min_stock_alert', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'min_stock_alert')
            ->orderBy('stock_quantity')
            ->orderBy('id')
            ->paginate($this->resolvePerPage($request, default: 100));

        return ProductResource::collection($products);
    }
}
