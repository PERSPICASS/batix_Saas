<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\Shop;
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
        
        $query = Inventory::with(['shop', 'user'])
            ->whereHas('shop', function ($q) use ($activeShopId) {
                $q->where('user_id', Auth::id());
                if ($activeShopId) {
                    $q->where('id', $activeShopId);
                }
            })
            ->orderBy('inventory_date', 'desc');

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

        $products = Product::with('shop')
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->whereHas('shop', function ($q) use ($activeShopId) {
                $q->where('user_id', Auth::id());
                if ($activeShopId) {
                    $q->where('id', $activeShopId);
                }
            })
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
                    'counted_quantity' => $item['counted_quantity'] ?? 0,
                    'defective_quantity' => $item['defective_quantity'] ?? 0,
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
            'shops' => Shop::select('id', 'name')->get(),
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

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'inventory_date' => 'required|date',
            'status' => 'required|in:draft,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
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
                    'counted_quantity' => $item['counted_quantity'] ?? 0,
                    'defective_quantity' => $item['defective_quantity'] ?? 0,
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
            'items' => $inventory->items->map(fn (InventoryItem $item) => [
                'id' => $item->id,
                'product_name' => $item->product->name,
                'good_before' => $item->product->stock_quantity,
                'good_after' => $item->counted_quantity ?? 0,
                'defective_before' => $item->product->defective_stock_quantity,
                'defective_after' => $item->defective_quantity,
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

        DB::transaction(function () use ($inventory) {
            foreach ($inventory->items as $item) {
                StockMovementService::recordInventoryAdjustmentWithDefective(
                    $item->product,
                    $item->counted_quantity,
                    $item->defective_quantity,
                    $inventory->shop_id,
                    $inventory,
                    $item->unit_cost
                );
            }

            $inventory->status = 'completed';
            $inventory->save();
        });

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

