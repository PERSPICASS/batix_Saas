<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Subcategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        $shopId = $request->input('shop_id');
        $categoryId = $request->input('category_id');
        $search = $request->input('search');
        
        $query = Product::with(['shop', 'category', 'subcategory'])
            ->orderBy('name');

        // Filtrer par boutique active si sélectionnée
        if ($activeShopId) {
            $query->where('shop_id', $activeShopId);
        } elseif ($shopId) {
            $query->where('shop_id', $shopId);
        } else {
            // Afficher les produits de toutes les boutiques de l'utilisateur
            $query->whereHas('shop', function ($q) {
                $q->where('user_id', Auth::id());
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        $products = $query->paginate(20);

        $categories = Category::whereHas('shop', function ($q) use ($activeShopId) {
            $q->where('user_id', Auth::id());
            if ($activeShopId) {
                $q->where('id', $activeShopId);
            }
        })->get();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'shops' => Auth::user()->accessibleShops(),
            'filters' => $request->only(['shop_id', 'category_id', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $shops = Auth::user()->accessibleShops();
        $categories = Category::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->with('shop')->get();
        
        $subcategories = Subcategory::whereHas('category.shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->with('category')->get();

        return Inertia::render('Products/Create', [
            'shops' => $shops,
            'categories' => $categories,
            'subcategories' => $subcategories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'category_id' => 'nullable|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'stock_quantity' => 'nullable|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'image' => 'nullable|image|max:2048',
            'track_stock' => 'boolean',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        
        // Générer automatiquement le code-barres s'il n'est pas fourni
        if (empty($validated['barcode'])) {
            $validated['barcode'] = $this->generateUniqueBarcode();
        }
        
        // Générer automatiquement le SKU s'il n'est pas fourni
        if (empty($validated['sku'])) {
            $validated['sku'] = 'SKU-' . strtoupper(substr(uniqid(), -8));
        }
        
        // Gérer l'upload de l'image
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $shop->products()->create($validated);

        return redirect()->route('products.index')->with('success', 'Produit créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $this->authorize('view', $product);
        
        $product->load(['shop', 'category', 'subcategory']);
        
        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);
        
        $shops = Auth::user()->accessibleShops();
        $categories = Category::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->with('shop')->get();
        
        $subcategories = Subcategory::whereHas('category.shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->with('category')->get();
        
        return Inertia::render('Products/Edit', [
            'product' => $product,
            'shops' => $shops,
            'categories' => $categories,
            'subcategories' => $subcategories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        $this->authorize('update', $product);
        
        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'stock_quantity' => 'nullable|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'image' => 'nullable|image|max:2048',
            'track_stock' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Gérer l'upload de la nouvelle image
        if ($request->hasFile('image')) {
            // Supprimer l'ancienne image si elle existe
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($validated);

        return redirect()->route('products.index')->with('success', 'Produit mis à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        $this->authorize('delete', $product);
        
        // Supprimer l'image si elle existe
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        
        $product->delete();

        return redirect()->route('products.index')->with('success', 'Produit supprimé avec succès.');
    }

    /**
     * Generate a unique EAN-13 style barcode.
     * Format: 2 (internal) + 6 (random) + 4 (product number) + 1 (checksum)
     */
    private function generateUniqueBarcode(): string
    {
        do {
            // Commencer par '2' pour indiquer un code interne (usage interne)
            $prefix = '2';
            
            // 6 chiffres aléatoires pour l'entreprise
            $company = str_pad((string)rand(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // 4 chiffres pour le numéro de produit
            $productNum = str_pad((string)rand(0, 9999), 4, '0', STR_PAD_LEFT);
            
            // 12 premiers chiffres
            $barcode12 = $prefix . $company . $productNum;
            
            // Calculer le chiffre de contrôle EAN-13
            $checksum = $this->calculateEAN13Checksum($barcode12);
            
            // Code-barres complet
            $barcode = $barcode12 . $checksum;
            
            // Vérifier l'unicité
        } while (Product::where('barcode', $barcode)->exists());
        
        return $barcode;
    }

    /**
     * Calculate EAN-13 checksum digit.
     */
    private function calculateEAN13Checksum(string $barcode12): int
    {
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int)$barcode12[$i];
            $sum += ($i % 2 === 0) ? $digit : $digit * 3;
        }
        
        $checksum = (10 - ($sum % 10)) % 10;
        return $checksum;
    }
}
