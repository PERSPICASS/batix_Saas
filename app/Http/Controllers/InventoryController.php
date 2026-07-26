<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Services\StockMovementService;
use App\Services\InventoryAnalysisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        
        // `accessibleShopsQuery()` et non `shop.user_id = Auth::id()` : ce filtre-là exigeait
        // que la boutique soit POSSÉDÉE par l'utilisateur courant. Un gérant ou un caissier
        // n'en possède aucune — le module leur affichait donc une liste vide, alors que leurs
        // permissions `inventory` leur en donnaient l'accès, et que show()/edit()/update()
        // les acceptaient déjà. Un rôle n'est pas une frontière de tenant.
        $accessibleShopIds = Auth::user()->accessibleShopsQuery()
            ->when($activeShopId, fn ($q) => $q->where('id', $activeShopId))
            ->pluck('shops.id');

        $query = Inventory::with(['shop', 'user'])
            ->whereIn('shop_id', $accessibleShopIds)
            // Second critère de tri : à dates égales, l'ordre variait d'une page à l'autre,
            // si bien qu'un inventaire pouvait apparaître deux fois ou pas du tout.
            ->orderBy('inventory_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $inventories = $query->paginate(15)->withQueryString();

        return Inertia::render('Inventory/Index', [
            'inventories' => $inventories,
            'filters' => $request->only(['status']),
        ]);
    }

    public function create(): Response
    {
        $activeShopId = get_active_shop_id();

        // Même correction que index() : les boutiques accessibles, non les boutiques possédées.
        $accessibleShopIds = Auth::user()->accessibleShopsQuery()
            ->when($activeShopId, fn ($q) => $q->where('id', $activeShopId))
            ->pluck('shops.id');

        $products = Product::with('shop')
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->whereIn('shop_id', $accessibleShopIds)
            ->get();

        // Enrich products with movement data
        $enrichedProducts = InventoryAnalysisService::enrichProductsWithMovements($products, $activeShopId);

        return Inertia::render('Inventory/Create', [
            'shops' => Auth::user()->accessibleShops(),
            'products' => $enrichedProducts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $request->input('shop_id'))->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'inventory_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                // `inventory_items` porte un unique (inventory_id, product_id) : deux lignes
                // sur le même produit provoquaient une 500 au lieu d'une erreur de saisie.
                'distinct',
                Rule::exists('products', 'id')->where('shop_id', $request->input('shop_id')),
            ],
            'items.*.counted_quantity' => 'nullable|integer|min:0',
            'items.*.defective_quantity' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $inventory = Inventory::create([
                'shop_id' => $validated['shop_id'],
                'user_id' => auth()->id(),
                'inventory_date' => $validated['inventory_date'],
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                InventoryItem::create([
                    'inventory_id' => $inventory->id,
                    'product_id' => $item['product_id'],
                    'expected_quantity' => $product->stock_quantity,
                    'expected_defective_quantity' => $product->defective_stock_quantity,
                    // Pas de `?? 0` : un null veut dire « pas compté », et l'application de
                    // l'inventaire saute ces lignes. Les ramener à 0 mettait le stock du
                    // produit à zéro dès qu'on ajoutait une ligne sans la remplir.
                    'counted_quantity' => $item['counted_quantity'] ?? null,
                    'defective_quantity' => $item['defective_quantity'] ?? null,
                    'unit_cost' => $product->purchase_price,
                ]);
            }

            // Update inventory stats
            $inventory->total_items = count($validated['items']);
            $inventory->total_discrepancies = InventoryItem::where('inventory_id', $inventory->id)
                ->where(fn ($q) => $q->where('difference', '!=', 0)->orWhere('defective_difference', '!=', 0))
                ->count();
            $inventory->save();
        });

        return redirect()->route('inventory.index', ['code_user' => request()->route('code_user')])->with('success', 'Inventaire créé avec succès.');
    }

    public function show(string $code_user, Inventory $inventory): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $inventory->shop_id)->exists()) {
            abort(403);
        }

        $inventory->load(['shop', 'user', 'items.product']);

        return Inertia::render('Inventory/Show', [
            'inventory' => $inventory,
        ]);
    }

    public function edit(string $code_user, Inventory $inventory): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $inventory->shop_id)->exists()) {
            abort(403);
        }

        $inventory->load(['items.product']);

        $products = Product::with('shop')
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->where('shop_id', $inventory->shop_id)
            ->get();

        // Enrich products with movement data
        $enrichedProducts = InventoryAnalysisService::enrichProductsWithMovements($products, $inventory->shop_id);

        return Inertia::render('Inventory/Edit', [
            'inventory' => $inventory,
            'shops' => Auth::user()->accessibleShops(),
            'products' => $enrichedProducts,
        ]);
    }

    public function update(Request $request, string $code_user, Inventory $inventory): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $inventory->shop_id)->exists()) {
            abort(403);
        }

        if (!Auth::user()->accessibleShopsQuery()->where('id', $request->input('shop_id'))->exists()) {
            abort(403);
        }

        if ($inventory->status === 'completed') {
            return back()->withErrors(['error' => 'Impossible de modifier un inventaire terminé.']);
        }

        // Un inventaire ne déménage pas. Ses lignes portent les quantités attendues des
        // produits d'UNE boutique ; le transférer ailleurs n'a pas de sens comptable, et
        // n'était possible que parce que `shop_id` figurait dans les champs modifiables.
        if ((int) $request->input('shop_id') !== $inventory->shop_id) {
            return back()->withErrors(['shop_id' => "La boutique d'un inventaire ne peut pas être changée."]);
        }

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'inventory_date' => 'required|date',
            // Pas de `completed` ici, et c'est le cœur du problème que ça corrige : seul
            // complete() termine un inventaire, parce que seul complete() ajuste les stocks.
            // Accepté ici, ce statut figeait un inventaire « terminé » sans qu'aucun stock ne
            // bouge — et plus rien ne pouvait le rattraper, update(), complete() et destroy()
            // refusant tous les trois de toucher un inventaire terminé. Le formulaire ne
            // proposait déjà que ces trois valeurs (Inventory/Edit.tsx).
            'status' => 'required|in:draft,in_progress,cancelled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                'distinct',
                Rule::exists('products', 'id')->where('shop_id', $request->input('shop_id')),
            ],
            'items.*.counted_quantity' => 'nullable|integer|min:0',
            'items.*.defective_quantity' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $inventory) {
            $inventory->update([
                'shop_id' => $validated['shop_id'],
                'inventory_date' => $validated['inventory_date'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Preserve the original expected quantities for products already counted in this
            // inventory, so re-saving a draft doesn't silently shift everyone's baseline to
            // whatever the live stock happens to be at save time (see StockMovementService).
            $existingByProduct = $inventory->items()->get()->keyBy('product_id');

            // Delete existing items
            $inventory->items()->delete();

            // Create new items
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $existing = $existingByProduct->get($item['product_id']);

                InventoryItem::create([
                    'inventory_id' => $inventory->id,
                    'product_id' => $item['product_id'],
                    'expected_quantity' => $existing->expected_quantity ?? $product->stock_quantity,
                    'expected_defective_quantity' => $existing->expected_defective_quantity ?? $product->defective_stock_quantity,
                    // Pas de `?? 0` : un null veut dire « pas compté », et l'application de
                    // l'inventaire saute ces lignes. Les ramener à 0 mettait le stock du
                    // produit à zéro dès qu'on ajoutait une ligne sans la remplir.
                    'counted_quantity' => $item['counted_quantity'] ?? null,
                    'defective_quantity' => $item['defective_quantity'] ?? null,
                    'unit_cost' => $product->purchase_price,
                ]);
            }

            // Update stats
            $inventory->total_items = count($validated['items']);
            $inventory->total_discrepancies = InventoryItem::where('inventory_id', $inventory->id)
                ->where(fn ($q) => $q->where('difference', '!=', 0)->orWhere('defective_difference', '!=', 0))
                ->count();
            $inventory->save();
        });

        return redirect()->route('inventory.index', ['code_user' => request()->route('code_user')])->with('success', 'Inventaire mis à jour avec succès.');
    }

    /**
     * JSON preview of the stock adjustments "Terminer l'inventaire" will apply, computed
     * against the product's live stock (same comparison StockMovementService uses), so the
     * confirmation shown to the user always matches what will actually happen.
     */
    public function completionPreview(string $code_user, Inventory $inventory): \Illuminate\Http\JsonResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $inventory->shop_id)->exists()) {
            abort(403);
        }

        $inventory->load('items.product:id,name,stock_quantity,defective_stock_quantity');

        return response()->json([
            // Les lignes non comptées n'apparaissent pas : elles ne changeront rien, et les
            // afficher avec un « après » à 0 annonçait l'inverse de ce qui allait se passer.
            'items' => $inventory->items
                ->whereNotNull('counted_quantity')
                ->values()
                ->map(fn (InventoryItem $item) => [
                    'id' => $item->id,
                    'product_name' => $item->product->name,
                    'good_before' => $item->product->stock_quantity,
                    'good_after' => $item->counted_quantity,
                    'defective_before' => $item->product->defective_stock_quantity,
                    'defective_after' => $item->defective_quantity ?? $item->product->defective_stock_quantity,
                ]),
        ]);
    }

    public function complete(string $code_user, Inventory $inventory): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $inventory->shop_id)->exists()) {
            abort(403);
        }

        if ($inventory->status === 'completed') {
            return back()->withErrors(['error' => 'Cet inventaire est déjà terminé.']);
        }

        // Un inventaire annulé ne s'applique pas. La garde ne testait que `completed`, si bien
        // qu'annuler ne protégeait de rien : le comptage d'un inventaire abandonné pouvait
        // encore écraser les stocks réels.
        if ($inventory->status === 'cancelled') {
            return back()->withErrors(['error' => 'Cet inventaire est annulé : il ne peut plus être appliqué.']);
        }

        // Un inventaire dont aucune ligne n'a été comptée n'ajusterait rien, mais poserait
        // quand même un `completed_at` — donc une nouvelle borne « depuis le dernier
        // inventaire » qui ne repose sur aucun comptage. Mieux vaut refuser.
        if ($inventory->items()->whereNotNull('counted_quantity')->doesntExist()) {
            return back()->withErrors(['error' => "Aucune ligne n'a été comptée : rien à appliquer."]);
        }

        $applied = DB::transaction(function () use ($inventory) {
            // Le statut est relu SOUS VERROU, et pas seulement plus haut. Deux requêtes
            // simultanées lisaient toutes deux « draft » et le même stock, appliquaient
            // chacune l'écart, et écrivaient deux mouvements pour un seul écart réel. Le
            // compteur s'en sortait — il est fixé en valeur absolue — mais le registre non,
            // et c'est cette divergence que stock:audit signale le lundi suivant.
            $locked = Inventory::whereKey($inventory->getKey())->lockForUpdate()->first();

            if (!$locked || $locked->status === 'completed') {
                return false;
            }

            foreach ($inventory->items as $item) {
                // Les lignes non comptées sont ignorées : un inventaire partiel ne prétend rien
                // sur ce qu'il n'a pas regardé. Le défectueux non renseigné vaut l'existant, et
                // non zéro, pour la même raison.
                if ($item->counted_quantity === null) {
                    continue;
                }

                // Réaligner l'attendu sur ce qui est RÉELLEMENT mesuré, juste avant de mesurer.
                //
                // `expected_quantity` était le compteur au moment de la création de
                // l'inventaire, alors que l'écart appliqué se calcule sur le compteur au moment
                // de l'application. Un brouillon laissé ouvert quelques jours affichait donc un
                // écart qui n'était pas celui écrit au registre — et la fiche d'inventaire
                // présente ce nombre comme un fait. Les deux ne peuvent plus diverger.
                $item->expected_quantity = $item->product->stock_quantity;
                $item->expected_defective_quantity = $item->product->defective_stock_quantity;
                $item->save();

                StockMovementService::recordInventoryAdjustmentWithDefective(
                    $item->product,
                    $item->counted_quantity,
                    $item->defective_quantity ?? $item->product->defective_stock_quantity,
                    $inventory->shop_id,
                    $inventory,
                    $item->unit_cost
                );
            }

            // Les écarts ayant pu changer avec le réalignement, le compte affiché sur la fiche
            // doit être refait — sinon il reste celui du dernier enregistrement du brouillon.
            $locked->total_discrepancies = $inventory->items()
                ->where(fn ($q) => $q->where('difference', '!=', 0)->orWhere('defective_difference', '!=', 0))
                ->count();

            $locked->status = 'completed';
            // Horodater l'ajustement, et non le comptage : `inventory_date` est saisie à la
            // main, donc inapte à dater ce qui a réellement bougé (InventoryAnalysisService).
            $locked->completed_at = now();
            $locked->save();

            return true;
        });

        if (!$applied) {
            return back()->withErrors(['error' => 'Cet inventaire est déjà terminé.']);
        }

        return redirect()->route('inventory.show', $inventory)->with('success', 'Inventaire terminé et stocks ajustés.');
    }

    public function destroy(string $code_user, Inventory $inventory): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $inventory->shop_id)->exists()) {
            abort(403);
        }

        if ($inventory->status === 'completed') {
            return back()->withErrors(['error' => 'Impossible de supprimer un inventaire terminé.']);
        }

        $inventory->delete();

        return redirect()->route('inventory.index', ['code_user' => request()->route('code_user')])->with('success', 'Inventaire supprimé avec succès.');
    }
}

