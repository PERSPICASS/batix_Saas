<?php

namespace App\Http\Controllers;

use App\Exports\DepotStockTemplateExport;
use App\Imports\DepotStockImport;
use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\DepotTransfer;
use App\Models\Product;
use App\Models\Shop;
use App\Services\StockMovementService;
use App\Traits\GeneratesBarcode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Inertia\Response;

class DepotController extends Controller
{
    use GeneratesBarcode;
    public function index(Request $request, string $codeUser): Response
    {
        $user = Auth::user();
        $search = $request->input('search');

        $query = Depot::where('code_user', $user->code_user)
            ->withCount('depotProducts')
            ->with('user')
            ->latest();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $depots = $query->get()->map(fn($depot) => [
            'id' => $depot->id,
            'name' => $depot->name,
            'address' => $depot->address,
            'city' => $depot->city,
            'phone' => $depot->phone,
            'description' => $depot->description,
            'is_active' => $depot->is_active,
            'depot_products_count' => $depot->depot_products_count,
            'total_stock' => $depot->depotProducts()->sum('quantity'),
            'created_at' => $depot->created_at->format('d/m/Y'),
        ]);

        return Inertia::render('Depots/Index', [
            'depots' => $depots,
            'filters' => $request->only(['search']),
            'canCreateDepot' => $user->canCreateDepot(),
            'remainingDepots' => $user->remainingDepotSlots(),
        ]);
    }

    public function create(string $codeUser): Response
    {
        return Inertia::render('Depots/Create');
    }

    public function store(Request $request, string $codeUser)
    {
        $user = Auth::user();

        // Vérifier le quota de dépôts
        if (!$user->canCreateDepot()) {
            $limits = $user->getSubscriptionLimits();
            $max = $limits['max_depots'];
            if ($max === 0) {
                return back()->with('error', "Votre offre actuelle ne permet pas de créer des dépôts. Passez à un plan supérieur.");
            }
            return back()->with('error', "Vous avez atteint la limite de {$max} dépôt(s) de votre offre. Passez à un plan supérieur pour en ajouter davantage.");
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'description' => 'nullable|string',
        ]);

        $depot = Depot::create([
            ...$validated,
            'code_user' => $user->code_user,
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        return redirect()->route('depots.show', [
            'code_user' => $user->code_user,
            'depot' => $depot->id,
        ])->with('success', 'Dépôt créé avec succès.');
    }

    public function show(string $codeUser, Depot $depot): Response
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $depot->load(['depotProducts.product.category', 'user']);

        $products = $depot->depotProducts->map(fn($dp) => [
            'id' => $dp->id,
            'product_id' => $dp->product_id,
            'product_name' => $dp->product->name,
            'product_sku' => $dp->product->sku,
            'product_category' => $dp->product->category?->name,
            'product_image' => $dp->product->image,
            'quantity' => $dp->quantity,
            'min_stock_alert' => $dp->min_stock_alert,
            'purchase_price' => (float) $dp->purchase_price,
            'is_low_stock' => $dp->isLowStock(),
        ]);

        // Historique des 10 derniers transferts
        $recentTransfers = DepotTransfer::where('depot_id', $depot->id)
            ->with(['shop', 'product', 'user'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'reference' => $t->reference,
                'shop_name' => $t->shop->name,
                'product_name' => $t->product->name,
                'product_image' => $t->product->image,
                'quantity' => $t->quantity,
                'user_name' => $t->user->name,
                'transferred_at' => $t->transferred_at->format('d/m/Y H:i'),
            ]);

        // Données pour les modals
        $shops = Shop::where('user_id', $user->id)
            ->where('is_active', true)
            ->get(['id', 'name']);

        $allProducts = Product::whereIn('shop_id', $user->accessibleShopsQuery()->pluck('id'))
            ->whereNull('parent_id')
            ->select('id', 'name', 'sku')
            ->orderBy('name')
            ->get();

        // Autres dépôts du même compte (pour transfert dépôt → dépôt)
        $otherDepots = Depot::where('code_user', $user->code_user)
            ->where('id', '!=', $depot->id)
            ->where('is_active', true)
            ->get(['id', 'name']);

        return Inertia::render('Depots/Show', [
            'depot' => [
                'id' => $depot->id,
                'name' => $depot->name,
                'address' => $depot->address,
                'city' => $depot->city,
                'phone' => $depot->phone,
                'description' => $depot->description,
                'is_active' => $depot->is_active,
            ],
            'products' => $products,
            'recentTransfers' => $recentTransfers,
            'stats' => [
                'total_products'   => $depot->depotProducts->count(),
                'total_stock'      => $depot->depotProducts->sum('quantity'),
                'low_stock_count'  => $depot->depotProducts->filter(fn($dp) => $dp->isLowStock())->count(),
                'total_value'      => $depot->depotProducts->sum(fn($dp) => $dp->quantity * $dp->purchase_price),
            ],
            'shops' => $shops,
            'allProducts' => $allProducts,
            'otherDepots' => $otherDepots,
        ]);
    }

    public function edit(string $codeUser, Depot $depot): Response
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        return Inertia::render('Depots/Edit', [
            'depot' => $depot,
        ]);
    }

    public function update(Request $request, string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $depot->update($validated);

        return redirect()->route('depots.show', [
            'code_user' => $user->code_user,
            'depot' => $depot->id,
        ])->with('success', 'Dépôt mis à jour.');
    }

    public function destroy(string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $depot->delete();

        return redirect()->route('depots.index', ['code_user' => $user->code_user])
            ->with('success', 'Dépôt supprimé.');
    }

    // --- Gestion du stock dans le dépôt ---

    public function addStock(Request $request, string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'sku'             => 'nullable|string|max:100',
            'quantity'        => 'required|integer|min:1',
            'min_stock_alert' => 'nullable|integer|min:0',
            'purchase_price'  => 'nullable|numeric|min:0',
            'image'           => 'nullable|image|max:2048',
        ]);

        // Chercher d'abord dans les boutiques du compte (par nom exact ou SKU)
        $shopIds = $user->accessibleShopsQuery()->pluck('id');

        $product = null;
        if (!empty($validated['sku'])) {
            $product = Product::whereIn('shop_id', $shopIds)->where('sku', $validated['sku'])->first();
        }
        if (!$product) {
            $product = Product::whereIn('shop_id', $shopIds)->where('name', $validated['name'])->first();
        }

        // Si le produit n'existe pas, le créer dans la première boutique active du compte
        if (!$product) {
            $shopId = get_active_shop_id() ?? $user->accessibleShopsQuery()->value('id');

            if (!$shopId) {
                return back()->withErrors(['name' => 'Aucune boutique disponible pour créer le produit.']);
            }

            $product = Product::create([
                'name'            => $validated['name'],
                'sku'             => $validated['sku'] ?? ('SKU-' . strtoupper(substr(uniqid(), -8))),
                'shop_id'         => $shopId,
                'stock_quantity'  => 0,
                'selling_price'   => 0,
                'purchase_price'  => 0,
                'unit'            => 'Pièce',
                'is_active'       => true,
                'track_stock'     => true,
                'image'           => $request->hasFile('image')
                    ? $request->file('image')->store('products', 'public')
                    : null,
            ]);

            // Générer le code-barres EAN-13 automatiquement
            $product->barcode = $this->generateBarcodeWithPrice(
                $product->id,
                $product->category_id,
                $product->selling_price
            );
            $product->save();
        }

        $depotProduct = DepotProduct::firstOrCreate(
            ['depot_id' => $depot->id, 'product_id' => $product->id],
            ['quantity' => 0, 'min_stock_alert' => 0, 'purchase_price' => $validated['purchase_price'] ?? 0]
        );

        $depotProduct->increment('quantity', $validated['quantity']);

        $updates = [];
        if (isset($validated['min_stock_alert'])) {
            $updates['min_stock_alert'] = $validated['min_stock_alert'];
        }
        if (isset($validated['purchase_price'])) {
            $updates['purchase_price'] = $validated['purchase_price'];
        }
        if (!empty($updates)) {
            $depotProduct->update($updates);
        }

        return back()->with('success', "Produit \"{$product->name}\" ajouté au dépôt.");
    }

    public function updateStock(Request $request, string $codeUser, Depot $depot, DepotProduct $depotProduct)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $validated = $request->validate([
            'quantity'        => 'required|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:0',
            'purchase_price'  => 'nullable|numeric|min:0',
            'name'            => 'nullable|string|max:255',
            'sku'             => 'nullable|string|max:100',
            'image'           => 'nullable|image|max:2048',
        ]);

        // Mettre à jour les champs DepotProduct
        $depotProduct->update([
            'quantity'        => $validated['quantity'],
            'min_stock_alert' => $validated['min_stock_alert'] ?? $depotProduct->min_stock_alert,
            'purchase_price'  => $validated['purchase_price'] ?? $depotProduct->purchase_price,
        ]);

        // Mettre à jour les champs du Product lié
        $product = $depotProduct->product;
        if ($product) {
            $productUpdates = [];

            if (!empty($validated['name'])) {
                $productUpdates['name'] = $validated['name'];
            }
            if (array_key_exists('sku', $validated)) {
                $productUpdates['sku'] = $validated['sku'];
            }
            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image
                if ($product->image) {
                    \Storage::disk('public')->delete($product->image);
                }
                $productUpdates['image'] = $request->file('image')->store('products', 'public');
            }

            if (!empty($productUpdates)) {
                $product->update($productUpdates);
            }
        }

        return back()->with('success', 'Produit mis à jour.');
    }

    public function removeStock(string $codeUser, Depot $depot, DepotProduct $depotProduct)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $depotProduct->delete();

        return back()->with('success', 'Produit retiré du dépôt.');
    }

    // --- Transfert dépôt → boutique ---

    public function transferStock(Request $request, string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $validated = $request->validate([
            'shop_id'              => 'required|exists:shops,id',
            'notes'                => 'nullable|string',
            'items'                => 'required|array|min:1',
            'items.*.product_id'   => 'required|exists:products,id',
            'items.*.quantity'     => 'required|integer|min:1',
        ]);

        // Vérifier le stock disponible pour chaque produit
        $errors = [];
        $depotProducts = [];

        foreach ($validated['items'] as $index => $item) {
            $depotProduct = DepotProduct::where('depot_id', $depot->id)
                ->where('product_id', $item['product_id'])
                ->first();

            if (!$depotProduct || $depotProduct->quantity < $item['quantity']) {
                $productName = Product::find($item['product_id'])?->name ?? "Produit #{$item['product_id']}";
                $errors["items.{$index}.quantity"] = "Stock insuffisant pour « {$productName} » (disponible : " . ($depotProduct?->quantity ?? 0) . ").";
            } else {
                $depotProducts[$index] = $depotProduct;
            }
        }

        if (!empty($errors)) {
            return back()->withErrors($errors);
        }

        DB::transaction(function () use ($depot, $depotProducts, $validated, $user) {
            foreach ($validated['items'] as $index => $item) {
                $depotProduct = $depotProducts[$index];

                // Décrémenter le stock du dépôt
                $depotProduct->decrement('quantity', $item['quantity']);

                // Créer le transfert d'abord (pour la référence)
                $depotTransfer = DepotTransfer::create([
                    'depot_id'   => $depot->id,
                    'shop_id'    => $validated['shop_id'],
                    'user_id'    => $user->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'notes'      => $validated['notes'] ?? null,
                    'status'     => 'completed',
                ]);

                // Incrémenter le stock du produit dans la boutique
                $shopProduct = Product::where('id', $item['product_id'])
                    ->where('shop_id', $validated['shop_id'])
                    ->first();

                if ($shopProduct) {
                    StockMovementService::recordDepotTransfer(
                        $shopProduct,
                        $item['quantity'],
                        $validated['shop_id'],
                        $depotTransfer
                    );

                    // Propager le prix d'achat du dépôt vers le produit de la boutique
                    if ($depotProduct->purchase_price > 0) {
                        $shopProduct->update(['purchase_price' => $depotProduct->purchase_price]);
                    }
                }
            }
        });

        $count = count($validated['items']);
        return back()->with('success', $count === 1 ? 'Transfert effectué avec succès.' : "{$count} produits transférés avec succès.");
    }

    // --- Transfert dépôt → dépôt ---

    public function transferToDepot(Request $request, string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $validated = $request->validate([
            'target_depot_id'    => 'required|exists:depots,id|different:depot',
            'notes'              => 'nullable|string',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $targetDepot = Depot::findOrFail($validated['target_depot_id']);

        if ($targetDepot->code_user !== $user->code_user) {
            abort(403);
        }

        // Vérifier le stock disponible
        $errors = [];
        $depotProducts = [];

        foreach ($validated['items'] as $index => $item) {
            $depotProduct = DepotProduct::where('depot_id', $depot->id)
                ->where('product_id', $item['product_id'])
                ->first();

            if (!$depotProduct || $depotProduct->quantity < $item['quantity']) {
                $productName = Product::find($item['product_id'])?->name ?? "Produit #{$item['product_id']}";
                $errors["items.{$index}.quantity"] = "Stock insuffisant pour « {$productName} » (disponible : " . ($depotProduct?->quantity ?? 0) . ").";
            } else {
                $depotProducts[$index] = $depotProduct;
            }
        }

        if (!empty($errors)) {
            return back()->withErrors($errors);
        }

        DB::transaction(function () use ($depot, $targetDepot, $depotProducts, $validated, $user) {
            foreach ($validated['items'] as $index => $item) {
                $srcProduct = $depotProducts[$index];

                // Décrémenter le stock du dépôt source
                $srcProduct->decrement('quantity', $item['quantity']);

                // Incrémenter (ou créer) dans le dépôt cible
                $dstProduct = DepotProduct::firstOrCreate(
                    ['depot_id' => $targetDepot->id, 'product_id' => $item['product_id']],
                    ['quantity' => 0, 'min_stock_alert' => $srcProduct->min_stock_alert, 'purchase_price' => $srcProduct->purchase_price]
                );
                $dstProduct->increment('quantity', $item['quantity']);

                // Propager le prix d'achat si non défini dans la cible
                if ($dstProduct->purchase_price == 0 && $srcProduct->purchase_price > 0) {
                    $dstProduct->update(['purchase_price' => $srcProduct->purchase_price]);
                }
            }
        });

        $count = count($validated['items']);
        return back()->with('success', $count === 1
            ? "Transfert vers « {$targetDepot->name} » effectué."
            : "{$count} produits transférés vers « {$targetDepot->name} ».");
    }

    // --- Page transferts ---

    public function transfers(Request $request, string $codeUser, Depot $depot): Response
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $transfers = DepotTransfer::where('depot_id', $depot->id)
            ->with(['shop', 'product', 'user'])
            ->latest()
            ->paginate(20)
            ->through(fn($t) => [
                'id' => $t->id,
                'reference' => $t->reference,
                'shop_name' => $t->shop->name,
                'product_name' => $t->product->name,
                'product_image' => $t->product->image,
                'product_sku' => $t->product->sku,
                'quantity' => $t->quantity,
                'notes' => $t->notes,
                'user_name' => $t->user->name,
                'status' => $t->status,
                'transferred_at' => $t->transferred_at->format('d/m/Y H:i'),
            ]);

        // Données pour le formulaire de transfert
        $shops = Shop::where('user_id', $user->id)
            ->where('is_active', true)
            ->get(['id', 'name']);

        return Inertia::render('Depots/Transfers', [
            'depot' => [
                'id' => $depot->id,
                'name' => $depot->name,
            ],
            'transfers' => $transfers,
            'shops' => $shops,
            'depotProducts' => $depot->depotProducts()
                ->with('product')
                ->where('quantity', '>', 0)
                ->get()
                ->map(fn($dp) => [
                    'product_id' => $dp->product_id,
                    'product_name' => $dp->product->name,
                    'product_sku' => $dp->product->sku,
                    'quantity' => $dp->quantity,
                ]),
        ]);
    }

    // --- Import CSV / Excel ---

    public function importStock(Request $request, string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ]);

        $shopIds       = $user->accessibleShopsQuery()->pluck('id')->toArray();
        $defaultShopId = get_active_shop_id() ?? $user->accessibleShopsQuery()->value('id');

        if (!$defaultShopId) {
            return back()->with('error', 'Aucune boutique disponible pour créer les produits manquants.');
        }

        try {
            $import = new DepotStockImport($depot, $shopIds, (int) $defaultShopId);
            Excel::import($import, $request->file('file'));

            $count   = $import->getImportedCount();
            $errors  = $import->getErrors();

            $parts = [];
            if ($count['created'] > 0)          $parts[] = "{$count['created']} ligne(s) ajoutée(s)";
            if ($count['updated'] > 0)          $parts[] = "{$count['updated']} mise(s) à jour";
            if ($count['products_created'] > 0) $parts[] = "{$count['products_created']} produit(s) créé(s) automatiquement";
            if ($count['errors'] > 0)           $parts[] = "{$count['errors']} erreur(s)";

            $message = "Import terminé : " . implode(', ', $parts) . ".";

            if (!empty($errors)) {
                return back()->with('warning', $message)->with('import_errors', $errors);
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'Erreur lors de l\'import : ' . $e->getMessage());
        }
    }

    public function stockTemplate(string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $user->code_user) {
            abort(403);
        }

        return Excel::download(
            new DepotStockTemplateExport(),
            'modele_import_stock_depot.xlsx'
        );
    }
}
