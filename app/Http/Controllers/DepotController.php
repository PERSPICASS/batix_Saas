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
use Illuminate\Validation\ValidationException;
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

        $query = Depot::where('code_user', $codeUser)
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
            'code_user' => $codeUser,
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        return redirect()->route('depots.show', [
            'code_user' => $codeUser,
            'depot' => $depot->id,
        ])->with('success', 'Dépôt créé avec succès.');
    }

    public function show(string $codeUser, Depot $depot, Request $request): Response
    {
        $user = Auth::user();

        if ($depot->code_user !== $codeUser) {
            abort(403);
        }

        $depot->load(['user']);

        $search = $request->input('search');

        $products = DepotProduct::where('depot_id', $depot->id)
            ->with(['product.category'])
            ->when($search, fn($q) => $q->whereHas('product', fn($pq) => $pq
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
            ))
            ->paginate(25)
            ->withQueryString()
            ->through(fn($dp) => [
                'id' => $dp->id,
                'product_id' => $dp->product_id,
                'product_name' => $dp->product->name,
                'product_sku' => $dp->product->sku,
                'product_category' => $dp->product->category?->name,
                'product_image' => $dp->product->image,
                'quantity' => $dp->quantity,
                'min_stock_alert' => $dp->min_stock_alert,
                'purchase_price' => (float) $dp->purchase_price,
                // Valorisé au coût du PRODUIT — moyenne pondérée, à défaut prix d'achat — et
                // non au `purchase_price` de la ligne de dépôt, qui vaut 0 tant que personne
                // ne l'a saisi et qui donnait donc une réserve pleine valant zéro.
                'unit_cost' => $dp->product->unitCost(),
                'stock_value' => round($dp->quantity * $dp->product->unitCost(), 2),
                'is_low_stock' => $dp->isLowStock(),
            ]);

        // `with('product')` : le total valorise chaque ligne au coût de son produit, ce qui
        // sans cela ferait une requête par ligne du dépôt.
        $allDepotProducts = $depot->depotProducts()->with('product')->get();

        $depotProductsForTransfer = $allDepotProducts
            ->map(fn($dp) => [
                'depot_product_id' => $dp->id,
                'product_id'       => $dp->product_id,
                'product_name'     => $dp->product->name,
                'product_sku'      => $dp->product->sku,
                'quantity'         => $dp->quantity,
                'purchase_price'   => (float) $dp->purchase_price,
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
        $otherDepots = Depot::where('code_user', $codeUser)
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
                'total_products'   => $allDepotProducts->count(),
                'total_stock'      => $allDepotProducts->sum('quantity'),
                'low_stock_count'  => $allDepotProducts->filter(fn($dp) => $dp->isLowStock())->count(),
                'total_value'      => round($allDepotProducts->sum(fn($dp) => $dp->quantity * $dp->product->unitCost()), 2),
            ],
            'shops' => $shops,
            'allProducts' => $allProducts,
            'otherDepots' => $otherDepots,
            'depotProductsForTransfer' => $depotProductsForTransfer,
            'filters' => $request->only(['search']),
        ]);
    }

    public function edit(string $codeUser, Depot $depot): Response
    {
        if ($depot->code_user !== $codeUser) {
            abort(403);
        }

        return Inertia::render('Depots/Edit', [
            'depot' => $depot,
        ]);
    }

    public function update(Request $request, string $codeUser, Depot $depot)
    {
        if ($depot->code_user !== $codeUser) {
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
            'code_user' => $codeUser,
            'depot' => $depot->id,
        ])->with('success', 'Dépôt mis à jour.');
    }

    public function destroy(string $codeUser, Depot $depot)
    {
        if ($depot->code_user !== $codeUser) {
            abort(403);
        }

        $depot->delete();

        return redirect()->route('depots.index', ['code_user' => $codeUser])
            ->with('success', 'Dépôt supprimé.');
    }

    // --- Gestion du stock dans le dépôt ---

    public function addStock(Request $request, string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $codeUser) {
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
                'is_active'       => false,
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

        // Une entrée en dépôt est un mouvement de stock comme un autre : sans cette trace,
        // la quantité du dépôt était un nombre sans histoire.
        StockMovementService::recordDepotMovement(
            $product,
            $depot,
            (int) $validated['quantity'],
            'in',
            null,
            'Entrée en dépôt'
        );

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
        if ($depot->code_user !== $codeUser) {
            abort(403);
        }

        if ($depotProduct->depot_id !== $depot->id) {
            abort(404);
        }

        $validated = $request->validate([
            'quantity'        => 'required|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:0',
            'purchase_price'  => 'nullable|numeric|min:0',
            'name'            => 'nullable|string|max:255',
            'sku'             => 'nullable|string|max:100',
            'image'           => 'nullable|image|max:2048',
        ]);

        // La quantité est REMPLACÉE, pas corrigée d'un delta : un écart y disparaissait
        // sans laisser de trace. On note l'écart avant de l'appliquer.
        $previousQuantity = (int) $depotProduct->quantity;

        // Mettre à jour les champs DepotProduct
        $depotProduct->update([
            'quantity'        => $validated['quantity'],
            'min_stock_alert' => $validated['min_stock_alert'] ?? $depotProduct->min_stock_alert,
            'purchase_price'  => $validated['purchase_price'] ?? $depotProduct->purchase_price,
        ]);

        // Mettre à jour les champs du Product lié
        $product = $depotProduct->product;

        if ($product) {
            StockMovementService::recordDepotCount(
                $product,
                $depot,
                $previousQuantity,
                (int) $validated['quantity']
            );

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
        if ($depot->code_user !== $codeUser) {
            abort(403);
        }

        if ($depotProduct->depot_id !== $depot->id) {
            abort(404);
        }

        $depotProduct->delete();

        return back()->with('success', 'Produit retiré du dépôt.');
    }

    // --- Transfert dépôt → boutique ---

    public function transferStock(Request $request, string $codeUser, Depot $depot)
    {
        $user = Auth::user();

        if ($depot->code_user !== $codeUser) {
            abort(403);
        }

        $validated = $request->validate([
            'shop_id'              => 'required|exists:shops,id',
            'notes'                => 'nullable|string',
            'items'                => 'required|array|min:1',
            'items.*.product_id'   => 'required|exists:products,id',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.selling_price' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($depot, $validated, $user) {
            // Verrouiller et vérifier le stock disponible pour chaque produit à l'intérieur
            // de la transaction, pour empêcher deux transferts concurrents de survendre
            // le même stock de dépôt (le verrou est conservé jusqu'au commit/rollback).
            $errors = [];
            $depotProducts = [];

            foreach ($validated['items'] as $index => $item) {
                $depotProduct = DepotProduct::where('depot_id', $depot->id)
                    ->where('product_id', $item['product_id'])
                    ->lockForUpdate()
                    ->first();

                if (!$depotProduct || $depotProduct->quantity < $item['quantity']) {
                    $productName = Product::find($item['product_id'])?->name ?? "Produit #{$item['product_id']}";
                    $errors["items.{$index}.quantity"] = "Stock insuffisant pour « {$productName} » (disponible : " . ($depotProduct?->quantity ?? 0) . ").";
                } else {
                    $depotProducts[$index] = $depotProduct;
                }
            }

            if (!empty($errors)) {
                throw ValidationException::withMessages($errors);
            }

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

                // La sortie du dépôt, en regard de l'entrée en boutique enregistrée plus
                // bas : seul le `+N` boutique était journalisé, jamais le `-N` dépôt, si
                // bien que le transfert semblait créer du stock.
                StockMovementService::recordDepotMovement(
                    $depotProduct->product,
                    $depot,
                    -$item['quantity'],
                    'transfer',
                    $depotTransfer,
                    'Transfert vers la boutique'
                );

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

                    $updates = [];

                    // Activer le produit au premier transfert depuis le dépôt
                    if (!$shopProduct->is_active) {
                        $updates['is_active'] = true;
                    }

                    // Le prix du dépôt comble un vide, il n'écrase jamais : chaque boutique
                    // garde le sien. Un dépôt appartient au COMPTE et peut alimenter plusieurs
                    // boutiques — sans cette garde, une seule ligne de dépôt réécrivait le prix
                    // d'achat de produits appartenant à des boutiques différentes. Et ce prix
                    // n'est pas décoratif : c'est le repli de Product::unitCost() en l'absence
                    // de moyenne pondérée, donc une base de valorisation.
                    //
                    // Même règle que le transfert dépôt → dépôt plus bas, qui la respectait
                    // déjà ; les deux chemins disaient l'inverse l'un de l'autre.
                    //
                    // Comparaison en numérique : `purchase_price` est casté en decimal:2, donc
                    // l'attribut vaut la chaîne « 0.00 », qui est vraie en PHP.
                    if ($depotProduct->purchase_price > 0 && (float) $shopProduct->purchase_price <= 0) {
                        $updates['purchase_price'] = $depotProduct->purchase_price;
                    }

                    // Appliquer le prix de vente saisi lors du transfert
                    if (isset($item['selling_price']) && $item['selling_price'] > 0) {
                        $updates['selling_price'] = $item['selling_price'];
                    }

                    if (!empty($updates)) {
                        $shopProduct->update($updates);
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

        if ($depot->code_user !== $codeUser) {
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

        if ($targetDepot->code_user !== $codeUser) {
            abort(403);
        }

        DB::transaction(function () use ($depot, $targetDepot, $validated, $user) {
            // Verrouiller et vérifier le stock disponible à l'intérieur de la transaction,
            // pour empêcher deux transferts concurrents de survendre le même stock source.
            $errors = [];
            $depotProducts = [];

            foreach ($validated['items'] as $index => $item) {
                $depotProduct = DepotProduct::where('depot_id', $depot->id)
                    ->where('product_id', $item['product_id'])
                    ->lockForUpdate()
                    ->first();

                if (!$depotProduct || $depotProduct->quantity < $item['quantity']) {
                    $productName = Product::find($item['product_id'])?->name ?? "Produit #{$item['product_id']}";
                    $errors["items.{$index}.quantity"] = "Stock insuffisant pour « {$productName} » (disponible : " . ($depotProduct?->quantity ?? 0) . ").";
                } else {
                    $depotProducts[$index] = $depotProduct;
                }
            }

            if (!empty($errors)) {
                throw ValidationException::withMessages($errors);
            }

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

                // Les deux côtés du transfert, sortie et entrée. Aucun des deux n'était
                // journalisé : la marchandise passait d'un dépôt à l'autre sans trace.
                StockMovementService::recordDepotMovement(
                    $srcProduct->product,
                    $depot,
                    -$item['quantity'],
                    'transfer',
                    null,
                    "Transfert vers « {$targetDepot->name} »"
                );

                StockMovementService::recordDepotMovement(
                    $srcProduct->product,
                    $targetDepot,
                    (int) $item['quantity'],
                    'transfer',
                    null,
                    "Transfert depuis « {$depot->name} »"
                );

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
        if ($depot->code_user !== $codeUser) {
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

        if ($depot->code_user !== $codeUser) {
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
            // A large stock sheet (thousands of rows) can legitimately take longer than
            // PHP's default 30s execution limit — each row does its own lookups/writes.
            set_time_limit(300);

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

            if ($request->expectsJson()) {
                if (!empty($errors)) {
                    return response()->json(['success' => true, 'message' => $message, 'errors' => $errors], 200);
                }
                return response()->json(['success' => true, 'message' => $message], 200);
            }

            if (!empty($errors)) {
                return back()->with('warning', $message)->with('import_errors', $errors);
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Erreur lors de l\'import : ' . $e->getMessage()], 400);
            }
            return back()->with('error', 'Erreur lors de l\'import : ' . $e->getMessage());
        }
    }

    public function stockTemplate(string $codeUser, Depot $depot)
    {
        if ($depot->code_user !== $codeUser) {
            abort(403);
        }

        return Excel::download(
            new DepotStockTemplateExport(),
            'modele_import_stock_depot.xlsx'
        );
    }
}
