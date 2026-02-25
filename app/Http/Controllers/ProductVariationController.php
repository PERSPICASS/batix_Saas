<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductVariationController extends Controller
{
    /**
     * Afficher les déclinaisons d'un produit.
     */
    public function index(string $code_user, Product $product)
    {
        $this->authorize('view', $product);

        // Charger les déclinaisons du produit
        $product->load(['variations', 'category']);

        return Inertia::render('Products/Variations/Index', [
            'product' => $product,
            'variations' => $product->variations,
        ]);
    }

    /**
     * Créer une nouvelle déclinaison.
     */
    public function store(Request $request, string $code_user, Product $product)
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
        ]);

        // Créer la déclinaison (c'est un produit avec parent_id)
        $variation = Product::create([
            'shop_id' => $product->shop_id,
            'parent_id' => $product->id,
            'category_id' => $product->category_id,
            'subcategory_id' => $product->subcategory_id,
            'name' => $validated['name'],
            'brand' => $product->brand,
            'sku' => 'SKU-' . strtoupper(substr(uniqid(), -8)),
            'description' => $product->description,
            'unit' => $product->unit,
            'purchase_price' => $validated['purchase_price'],
            'selling_price' => $validated['selling_price'],
            'stock_quantity' => $validated['stock_quantity'] ?? 0,
            'min_stock_alert' => $product->min_stock_alert,
            'track_stock' => $product->track_stock,
            'is_active' => true,
            'has_variations' => false,
        ]);

        // Générer le code-barres
        $variation->barcode = $this->generateBarcode($variation);
        $variation->save();

        // Marquer le produit parent comme ayant des déclinaisons
        if (!$product->has_variations) {
            $product->update(['has_variations' => true]);
        }

        return back()->with('success', "Déclinaison \"{$variation->name}\" créée.");
    }

    /**
     * Mettre à jour une déclinaison.
     */
    public function update(Request $request, string $code_user, Product $product, Product $variation)
    {
        $this->authorize('update', $product);

        // Vérifier que la déclinaison appartient bien au produit
        if ($variation->parent_id !== $product->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $variation->update([
            'name' => $validated['name'],
            'purchase_price' => $validated['purchase_price'],
            'selling_price' => $validated['selling_price'],
            'stock_quantity' => $validated['stock_quantity'] ?? $variation->stock_quantity,
            'is_active' => $validated['is_active'] ?? $variation->is_active,
        ]);

        return back()->with('success', "Déclinaison mise à jour.");
    }

    /**
     * Supprimer une déclinaison.
     */
    public function destroy(string $code_user, Product $product, Product $variation)
    {
        $this->authorize('update', $product);

        // Vérifier que la déclinaison appartient bien au produit
        if ($variation->parent_id !== $product->id) {
            abort(403);
        }

        $variation->delete();

        // Vérifier si le produit a encore des déclinaisons
        if ($product->variations()->count() === 0) {
            $product->update(['has_variations' => false]);
        }

        return back()->with('success', "Déclinaison supprimée.");
    }

    /**
     * Générer un code-barres EAN-13.
     */
    private function generateBarcode(Product $product): string
    {
        $prefix = '2';
        $categoryCode = str_pad(($product->category_id ?? 0) % 100, 2, '0', STR_PAD_LEFT);
        $productCode = str_pad($product->id % 100000, 5, '0', STR_PAD_LEFT);
        $priceCode = str_pad(((int) ($product->selling_price / 100)) % 10000, 4, '0', STR_PAD_LEFT);
        
        $barcode12 = $prefix . $categoryCode . $productCode . $priceCode;
        
        // Calculer le checksum EAN-13
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int) $barcode12[$i];
            $sum += ($i % 2 === 0) ? $digit : $digit * 3;
        }
        $checksum = (10 - ($sum % 10)) % 10;
        
        return $barcode12 . $checksum;
    }
}
