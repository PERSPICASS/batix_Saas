<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\Shop;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            ->whereHas('shop', function ($q) use ($activeShopId) {
                $q->where('user_id', Auth::id());
                if ($activeShopId) {
                    $q->where('id', $activeShopId);
                }
            })
            ->get();

        return Inertia::render('Inventory/Create', [
            'shops' => Auth::user()->accessibleShops(),
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'inventory_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.counted_quantity' => 'required|integer|min:0',
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
                    'counted_quantity' => $item['counted_quantity'],
                    'unit_cost' => $product->purchase_price,
                ]);
            }

            // Update inventory stats
            $inventory->total_items = count($validated['items']);
            $inventory->total_discrepancies = InventoryItem::where('inventory_id', $inventory->id)
                ->where('difference', '!=', 0)
                ->count();
            $inventory->save();
        });

        return redirect()->route('inventory.index')->with('success', 'Inventaire créé avec succès.');
    }

    public function show(Inventory $inventory): Response
    {
        $inventory->load(['shop', 'user', 'items.product']);

        return Inertia::render('Inventory/Show', [
            'inventory' => $inventory,
        ]);
    }

    public function edit(Inventory $inventory): Response
    {
        $inventory->load(['items.product']);

        return Inertia::render('Inventory/Edit', [
            'inventory' => $inventory,
            'shops' => Shop::select('id', 'name')->get(),
            'products' => Product::with('shop')->where('is_active', true)->get(),
        ]);
    }

    public function update(Request $request, Inventory $inventory): RedirectResponse
    {
        if ($inventory->status === 'completed') {
            return back()->withErrors(['error' => 'Impossible de modifier un inventaire terminé.']);
        }

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'inventory_date' => 'required|date',
            'status' => 'required|in:draft,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.counted_quantity' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $inventory) {
            $inventory->update([
                'shop_id' => $validated['shop_id'],
                'inventory_date' => $validated['inventory_date'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Delete existing items
            $inventory->items()->delete();

            // Create new items
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                InventoryItem::create([
                    'inventory_id' => $inventory->id,
                    'product_id' => $item['product_id'],
                    'expected_quantity' => $product->stock_quantity,
                    'counted_quantity' => $item['counted_quantity'] ?? null,
                    'unit_cost' => $product->purchase_price,
                ]);
            }

            // Update stats
            $inventory->total_items = count($validated['items']);
            $inventory->total_discrepancies = InventoryItem::where('inventory_id', $inventory->id)
                ->where('difference', '!=', 0)
                ->count();
            $inventory->save();
        });

        return redirect()->route('inventory.index')->with('success', 'Inventaire mis à jour avec succès.');
    }

    public function complete(Inventory $inventory): RedirectResponse
    {
        if ($inventory->status === 'completed') {
            return back()->withErrors(['error' => 'Cet inventaire est déjà terminé.']);
        }

        DB::transaction(function () use ($inventory) {
            foreach ($inventory->items as $item) {
                if ($item->difference != 0) {
                    // Create stock movement for the difference
                    StockMovement::create([
                        'shop_id' => $inventory->shop_id,
                        'product_id' => $item->product_id,
                        'user_id' => auth()->id(),
                        'type' => 'adjustment',
                        'quantity' => $item->difference,
                        'unit_cost' => $item->unit_cost,
                        'reference_id' => $inventory->id,
                        'reference_type' => 'Inventory',
                        'notes' => "Ajustement suite à l'inventaire {$inventory->inventory_number}",
                        'movement_date' => $inventory->inventory_date,
                    ]);

                    // Update product stock
                    $product = $item->product;
                    $product->stock_quantity = $item->counted_quantity;
                    $product->save();
                }
            }

            $inventory->status = 'completed';
            $inventory->save();
        });

        return redirect()->route('inventory.show', $inventory)->with('success', 'Inventaire terminé et stocks ajustés.');
    }

    public function destroy(Inventory $inventory): RedirectResponse
    {
        if ($inventory->status === 'completed') {
            return back()->withErrors(['error' => 'Impossible de supprimer un inventaire terminé.']);
        }

        $inventory->delete();

        return redirect()->route('inventory.index')->with('success', 'Inventaire supprimé avec succès.');
    }
}

