<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Inventory;
use App\Models\SaleItem;
use App\Models\PurchaseItem;

class InventoryAnalysisService
{
    /**
     * Get product movement data since last inventory
     *
     * @param Product $product
     * @param int $shopId
     * @return array ['sold' => int, 'purchased' => int]
     */
    public static function getProductMovementsSinceLastInventory(Product $product, int $shopId): array
    {
        // Get the last completed inventory for this shop
        $lastInventory = Inventory::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->orderBy('inventory_date', 'desc')
            ->first();

        $sinceDate = $lastInventory ? $lastInventory->inventory_date : null;

        // Calculate sold quantity
        $sold = SaleItem::whereHas('sale', function ($query) use ($shopId) {
            $query->where('shop_id', $shopId);
        })
            ->where('product_id', $product->id)
            ->when($sinceDate, function ($query) use ($sinceDate) {
                return $query->whereDate('created_at', '>', $sinceDate);
            })
            ->sum('quantity');

        // Calculate purchased (received) quantity
        $purchased = PurchaseItem::whereHas('purchase', function ($query) use ($shopId) {
            $query->where('shop_id', $shopId)
                ->whereNotNull('received_date');
        })
            ->where('product_id', $product->id)
            ->when($sinceDate, function ($query) use ($sinceDate) {
                return $query->whereDate('received_date', '>', $sinceDate);
            })
            ->sum('quantity_received');

        return [
            'sold' => (int) $sold,
            'purchased' => (int) $purchased,
        ];
    }

    /**
     * Enrich products with movement data for inventory.
     *
     * Batches the "since last inventory" lookup and the sold/purchased sums across all
     * products in one pass instead of per-product queries, since this feeds the full list
     * of active products in a shop (previously ~3 queries per product).
     *
     * @param \Illuminate\Database\Eloquent\Collection $products
     * @param int $shopId
     * @return array
     */
    public static function enrichProductsWithMovements($products, int $shopId): array
    {
        $productIds = $products->pluck('id');

        $lastInventory = Inventory::where('shop_id', $shopId)
            ->where('status', 'completed')
            ->orderBy('inventory_date', 'desc')
            ->first();

        $sinceDate = $lastInventory?->inventory_date;

        $soldByProduct = SaleItem::whereHas('sale', function ($query) use ($shopId) {
            $query->where('shop_id', $shopId);
        })
            ->whereIn('product_id', $productIds)
            ->when($sinceDate, fn ($query) => $query->whereDate('created_at', '>', $sinceDate))
            ->selectRaw('product_id, SUM(quantity) as total')
            ->groupBy('product_id')
            ->pluck('total', 'product_id');

        $purchasedByProduct = PurchaseItem::whereHas('purchase', function ($query) use ($shopId) {
            $query->where('shop_id', $shopId)->whereNotNull('received_date');
        })
            ->whereIn('product_id', $productIds)
            ->when($sinceDate, fn ($query) => $query->whereDate('received_date', '>', $sinceDate))
            ->selectRaw('product_id, SUM(quantity_received) as total')
            ->groupBy('product_id')
            ->pluck('total', 'product_id');

        return $products->map(function (Product $product) use ($soldByProduct, $purchasedByProduct) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'stock_quantity' => $product->stock_quantity,
                'defective_stock_quantity' => $product->defective_stock_quantity,
                'purchase_price' => $product->purchase_price,
                'shop' => $product->shop,
                'sold_since_last_inventory' => (int) ($soldByProduct[$product->id] ?? 0),
                'purchased_since_last_inventory' => (int) ($purchasedByProduct[$product->id] ?? 0),
            ];
        })->toArray();
    }
}
