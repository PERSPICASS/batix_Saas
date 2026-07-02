<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Shop;
use App\Traits\GeneratesBarcode;

/**
 * Shared by the web product form (ProductController::store) and the public API
 * (Api\V1\ProductController::store) so default values and creation order only
 * live in one place. Barcode generation itself reuses GeneratesBarcode, already
 * shared with ProductsImport and DepotController.
 */
class ProductCreationService
{
    use GeneratesBarcode;

    public function create(array $validated, Shop $shop): Product
    {
        $validated = $this->applyDefaults($validated);

        $product = $shop->products()->create($validated);

        // Générer le code-barres avec catégorie, ID et prix si pas fourni ou invalide
        if (empty($validated['barcode']) || !preg_match('/^\d{13}$/', $validated['barcode'])) {
            $product->barcode = $this->generateBarcodeWithPrice(
                $product->id,
                $product->category_id,
                $product->selling_price
            );
            $product->save();
        }

        return $product;
    }

    public function applyDefaults(array $validated): array
    {
        $validated['tax_rate'] = $validated['tax_rate'] ?? 0;
        $validated['stock_quantity'] = $validated['stock_quantity'] ?? 0;
        $validated['min_stock_alert'] = $validated['min_stock_alert'] ?? 0;
        $validated['unit'] = $validated['unit'] ?? 'piece';
        $validated['track_stock'] = $validated['track_stock'] ?? true;

        if (empty($validated['sku'])) {
            $validated['sku'] = 'SKU-' . strtoupper(substr(uniqid(), -8));
        }

        return $validated;
    }
}
