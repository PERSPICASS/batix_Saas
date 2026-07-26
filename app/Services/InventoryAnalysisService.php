<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Inventory;
use App\Models\SaleItem;
use App\Models\PurchaseItem;

class InventoryAnalysisService
{
    /**
     * Enrich products with movement data for inventory.
     *
     * Batches the "since last inventory" lookup and the sold/purchased sums across all
     * products in one pass instead of per-product queries, since this feeds the full list
     * of active products in a shop (previously ~3 queries per product).
     *
     * `$shopId` est nullable, et doit l'être : get_active_shop_id() renvoie null pour un compte
     * sans boutique — un `int` strict faisait alors échouer la page « Nouvel inventaire » sur
     * une TypeError, donc une 500 au lieu d'une liste vide. Sans boutique, il n'y a rien à
     * enrichir, et les produits sortent tels quels.
     *
     * @param \Illuminate\Database\Eloquent\Collection $products
     * @param int|null $shopId
     * @return array
     */
    public static function enrichProductsWithMovements($products, ?int $shopId): array
    {
        $productIds = $products->pluck('id');

        // La référence temporelle est `completed_at`, l'instant où les stocks ont été ajustés,
        // et non `inventory_date`, saisie à la main. Comparer à une date écartait tout un jour
        // de ventes : celles faites après le comptage, le jour même du comptage.
        $since = $shopId
            ? Inventory::where('shop_id', $shopId)
                ->whereNotNull('completed_at')
                ->orderByDesc('completed_at')
                ->value('completed_at')
            : null;

        $soldByProduct = $shopId ? SaleItem::whereHas('sale', function ($query) use ($shopId) {
            $query->where('shop_id', $shopId);
        })
            ->whereIn('product_id', $productIds)
            ->when($since, fn ($query) => $query->where('created_at', '>', $since))
            ->selectRaw('product_id, SUM(quantity) as total')
            ->groupBy('product_id')
            ->pluck('total', 'product_id') : collect();

        // `received_date` appartient à `purchases`, pas à `purchase_items` : la condition de
        // date doit vivre DANS le whereHas, avec celle de boutique. Placée au niveau extérieur,
        // elle produit un SQL que Postgres rejette (« column received_date does not exist ») —
        // et que SQLite, lui, accepte en la résolvant contre la table du sous-EXISTS. La suite
        // de tests tournant sur SQLite ne peut donc pas attraper cette erreur : c'est la page
        // « Nouvel inventaire » en développement qui l'a révélée.
        $purchasedByProduct = $shopId ? PurchaseItem::whereHas('purchase', function ($query) use ($shopId, $since) {
            $query->where('shop_id', $shopId)
                ->whereNotNull('received_date')
                ->when($since, fn ($q) => $q->where('received_date', '>', $since));
        })
            ->whereIn('product_id', $productIds)
            ->selectRaw('product_id, SUM(quantity_received) as total')
            ->groupBy('product_id')
            ->pluck('total', 'product_id') : collect();

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
