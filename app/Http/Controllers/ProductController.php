<?php

namespace App\Http\Controllers;


use App\Exports\ProductsExport;
use App\Exports\ProductsTemplateExport;
use App\Imports\ProductsImport;
use App\Models\Category;
use App\Models\Product;
use App\Models\Subcategory;
use App\Services\ActivityLogger;
use App\Services\ProductCreationService;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

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
        $status = $request->input('status');
        
        $query = Product::with(['shop', 'category', 'subcategory'])
            ->whereNull('parent_id') // Exclure les déclinaisons
            ->orderBy('created_at', 'desc'); // Du plus récent au plus ancien

        // Filtrer par boutique active si sélectionnée
        if ($activeShopId) {
            $query->where('shop_id', $activeShopId);
        } elseif ($shopId && Auth::user()->accessibleShopsQuery()->where('id', $shopId)->exists()) {
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

        // Filtre par statut
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'low_stock') {
            $query->where('is_active', true)
                  ->where('track_stock', true)
                  ->whereNotNull('min_stock_alert')
                  ->whereColumn('stock_quantity', '<=', 'min_stock_alert');
        } else {
            // Par défaut : masquer les produits retirés (inactifs)
            $query->where('is_active', true);
        }

        $products = $query->paginate(20)->withQueryString();

        $shops = Auth::user()->accessibleShops();
        
        // Les catégories sont globales (prédéfinies par la plateforme)
        $categories = Category::orderBy('order')->orderBy('name')->get();

        // Quota par boutique active
        $activeShopId = get_active_shop_id() ?? $request->input('shop_id');

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'shops' => $shops,
            'filters' => $request->only(['shop_id', 'category_id', 'search', 'status']),
            'canCreateProduct' => Auth::user()->canCreateProduct($activeShopId),
            'remainingProducts' => Auth::user()->remainingProductSlots($activeShopId),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $shops = Auth::user()->accessibleShops();
        
        // Les catégories sont globales (prédéfinies par la plateforme)
        $categories = Category::orderBy('order')->orderBy('name')->get();
        
        // Les sous-catégories sont aussi globales
        $subcategories = Subcategory::with('category')
            ->orderBy('order')
            ->orderBy('name')
            ->get();

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
        $user = Auth::user();

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'category_id' => 'nullable|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
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
        $shop = $user->accessibleShopsQuery()->findOrFail($validated['shop_id']);

        // Vérifier le quota de produits de l'offre
        if (!$user->canCreateProduct($shop->id)) {
            $limits = $user->getSubscriptionLimits($shop->id);
            $max = $limits['max_products'];
            return back()->with('error', $max === 0
                ? "Votre offre actuelle ne permet pas de créer de produits. Passez à un plan supérieur."
                : "Vous avez atteint la limite de {$max} produit(s) de votre offre. Passez à un plan supérieur pour en ajouter davantage."
            );
        }

        // Gérer l'upload de l'image
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product = (new ProductCreationService())->create($validated, $shop);

        // Log activity
        ActivityLogger::created($product, $product->name);

        return redirect()->route('products.index', ['code_user' => request()->route('code_user')])->with('success', 'Produit créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Product $product)
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
    public function edit(string $code_user, Product $product): Response
    {
        $this->authorize('update', $product);
        
        $shops = Auth::user()->accessibleShops();
        
        // Les catégories sont globales (prédéfinies par la plateforme)
        $categories = Category::orderBy('order')->orderBy('name')->get();
        
        // Les sous-catégories sont aussi globales
        $subcategories = Subcategory::with('category')
            ->orderBy('order')
            ->orderBy('name')
            ->get();
        
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
    public function update(Request $request, string $code_user, Product $product)
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
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

        $oldStock = $product->stock_quantity;
        $newStock = (int) ($validated['stock_quantity'] ?? $oldStock);

        // Séparer stock_quantity de la mise à jour normale
        $updateData = collect($validated)
            ->except(['stock_quantity'])
            ->toArray();

        DB::transaction(function () use ($product, $updateData, $oldStock, $newStock, $code_user) {
            $product->update($updateData);

            // Enregistrer l'ajustement de stock s'il y a un changement
            if ($newStock !== $oldStock) {
                StockMovementService::recordManualAdjustment(
                    $product,
                    $newStock - $oldStock,
                    'adjustment',
                    $product->shop_id,
                    "Correction manuelle via formulaire produit (ancienne valeur: {$oldStock}, nouvelle: {$newStock})"
                );
            }
        });

        // Log activity
        ActivityLogger::updated($product, [], $product->name);

        return redirect()->route('products.index', ['code_user' => request()->route('code_user')])->with('success', 'Produit mis à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    /**
     * Retirer un produit de la boutique (désactivation sans suppression).
     * Le produit reste dans le dépôt mais n'est plus visible/vendable en boutique.
     */
    public function removeFromShop(string $code_user, Product $product)
    {
        $this->authorize('update', $product);

        $depotCount = \App\Models\DepotProduct::where('product_id', $product->id)
            ->where('quantity', '>', 0)
            ->count();

        $product->update([
            'is_active'      => false,
            'stock_quantity' => 0,
        ]);

        ActivityLogger::message('update', 'product_removed_from_shop', ['name' => $product->name], $product);

        $message = "Produit \"{$product->name}\" retiré de la boutique.";
        if ($depotCount > 0) {
            $message .= " Il reste présent dans {$depotCount} dépôt(s).";
        }

        return back()->with('success', $message);
    }

    /**
     * Remettre un produit en boutique (réactivation).
     */
    public function restoreToShop(string $code_user, Product $product)
    {
        $this->authorize('update', $product);

        $product->update(['is_active' => true]);

        ActivityLogger::message('update', 'product_restored_to_shop', ['name' => $product->name], $product);

        return back()->with('success', "Produit \"{$product->name}\" remis en vente dans la boutique.");
    }

    public function destroy(string $code_user, Product $product)    {
        $this->authorize('delete', $product);
        
        // Sauvegarder le nom avant suppression
        $productName = $product->name;

        // Vérifier si le produit est encore dans un dépôt
        $depotCount = \App\Models\DepotProduct::where('product_id', $product->id)
            ->where('quantity', '>', 0)
            ->count();

        if ($depotCount > 0) {
            return back()->with('error', "Impossible de supprimer \"{$productName}\" : ce produit est encore présent dans {$depotCount} dépôt(s). Retirez-le d'abord du dépôt.");
        }

        // Un produit ayant un historique (mouvements de stock, achats, inventaires) ne doit
        // pas être supprimé : ça effacerait silencieusement le grand livre comptable de la boutique.
        $hasHistory = \App\Models\StockMovement::where('product_id', $product->id)->exists()
            || \App\Models\PurchaseItem::where('product_id', $product->id)->exists()
            || \App\Models\InventoryItem::where('product_id', $product->id)->exists();

        if ($hasHistory) {
            return back()->with('error', "Impossible de supprimer \"{$productName}\" : ce produit a un historique de mouvements de stock, d'achats ou d'inventaires. Désactivez-le plutôt.");
        }

        // Supprimer les entrées dépôt sans stock (quantity = 0) avant de supprimer le produit
        \App\Models\DepotProduct::where('product_id', $product->id)->delete();
        
        // Supprimer l'image si elle existe
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        
        $product->delete();

        // Log activity
        ActivityLogger::deleted($product, $productName);

        return redirect()->route('products.index', ['code_user' => request()->route('code_user')])->with('success', 'Produit supprimé avec succès.');
    }


    /**
     * Decode category, product ID and price from an internal barcode.
     * 
     * @param string $barcode Code-barres EAN-13
     * @return array|null ['category_id' => int, 'product_id' => int, 'price' => int] ou null si pas un code interne
     */
    public static function decodeBarcodeWithPrice(string $barcode): ?array
    {
        // Vérifier que c'est un code interne (commence par "2" et a 13 chiffres)
        if (strlen($barcode) !== 13 || $barcode[0] !== '2' || !ctype_digit($barcode)) {
            return null;
        }
        
        return [
            'category_id' => (int)substr($barcode, 1, 2),
            'product_id' => (int)substr($barcode, 3, 5),
            'price' => (int)substr($barcode, 8, 4) * 100, // Reconvertir en FCFA
        ];
    }

    /**
     * Generate a unique EAN-13 style barcode (fallback without price).
     * Format: 2 (internal) + 6 (random) + 5 (product number) + 1 (checksum) = 13 digits
     * @deprecated Use generateBarcodeWithPrice instead
     */
    private function generateUniqueBarcode(): string
    {
        do {
            // Commencer par '2' pour indiquer un code interne (usage interne)
            $prefix = '2';
            
            // 6 chiffres aléatoires pour l'entreprise
            $company = str_pad((string)rand(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // 5 chiffres pour le numéro de produit (1 + 6 + 5 = 12 avant checksum)
            $productNum = str_pad((string)rand(0, 99999), 5, '0', STR_PAD_LEFT);
            
            // 12 premiers chiffres
            $barcode12 = $prefix . $company . $productNum;
            
            // Calculer le chiffre de contrôle EAN-13
            $checksum = $this->calculateEAN13Checksum($barcode12);
            
            // Code-barres complet (13 chiffres)
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
        // Vérifier que le code-barres a exactement 12 chiffres
        if (strlen($barcode12) !== 12 || !ctype_digit($barcode12)) {
            throw new \InvalidArgumentException('Barcode must be exactly 12 digits');
        }
        
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int)$barcode12[$i];
            $sum += ($i % 2 === 0) ? $digit : $digit * 3;
        }
        
        $checksum = (10 - ($sum % 10)) % 10;
        return $checksum;
    }

    /**
     * Download Excel template for product import.
     */
    public function downloadTemplate(string $code_user)
    {
        return Excel::download(new ProductsTemplateExport(), 'modele_import_produits.xlsx');
    }

    /**
     * Export products to Excel.
     */
    public function export(string $code_user)
    {
        $shopId = get_active_shop_id();
        $shop = current_shop();
        $filename = 'produits_' . ($shop?->slug ?? 'export') . '_' . date('Y-m-d') . '.xlsx';
        
        return Excel::download(new ProductsExport($shopId), $filename);
    }

    /**
     * Import products from Excel file.
     */
    public function import(Request $request, string $code_user)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240', // Max 10MB
        ]);

        $shopId = get_active_shop_id();
        
        if (!$shopId) {
            return back()->with('error', 'Veuillez sélectionner une boutique avant d\'importer.');
        }

        try {
            // A large catalog (thousands of rows) can legitimately take longer than PHP's
            // default 30s execution limit — each row does its own lookups/writes.
            set_time_limit(300);

            $import = new ProductsImport($shopId);
            Excel::import($import, $request->file('file'));
            
            $count = $import->getImportedCount();
            $errors = $import->getErrors();
            $skippedRows = $import->getSkippedRows();

            $message = "Import terminé : {$count['created']} produit(s) créé(s), {$count['updated']} mis à jour.";

            if (!empty($count['skipped'])) {
                $message .= " {$count['skipped']} ligne(s) ignorée(s) (nom manquant).";
            }

            if ($count['errors'] > 0) {
                $message .= " {$count['errors']} erreur(s).";
            }

            if (!empty($errors) || !empty($skippedRows)) {
                return back()
                    ->with('warning', $message)
                    ->with('import_errors', $errors)
                    ->with('import_skipped_rows', $skippedRows);
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de l\'import : ' . $e->getMessage());
        }
    }
}
