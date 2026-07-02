<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\StockMovementResource;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StockMovementController extends Controller
{
    use ScopesToAccessibleShops;

    public function index(Request $request): AnonymousResourceCollection
    {
        $movements = StockMovement::whereIn('shop_id', $this->resolveShopIds($request))
            ->with('product')
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->query('product_id')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->query('type')))
            ->when($request->filled('since'), fn ($q) => $q->where('created_at', '>', $request->query('since')))
            ->orderByDesc('created_at')
            ->paginate($this->resolvePerPage($request));

        return StockMovementResource::collection($movements);
    }
}
