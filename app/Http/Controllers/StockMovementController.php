<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use App\Models\Shop;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class StockMovementController extends Controller
{
    public function index(Request $request): Response
    {
        $query = StockMovement::with(['shop', 'product', 'user'])
            ->orderBy('movement_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('shop_id')) {
            $query->where('shop_id', $request->shop_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('movement_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('movement_date', '<=', $request->date_to);
        }

        $movements = $query->paginate(15)->withQueryString();

        return Inertia::render('Stocks/Index', [
            'movements' => $movements,
            'shops' => Shop::select('id', 'name')->get(),
            'filters' => $request->only(['search', 'type', 'shop_id', 'date_from', 'date_to']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Stocks/Create', [
            'shops' => Shop::select('id', 'name')->get(),
            'products' => Product::with('shop')->where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out,transfer,adjustment',
            'quantity' => 'required|integer|not_in:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'movement_date' => 'required|date',
        ]);

        $validated['user_id'] = auth()->id();
        $movement = StockMovement::create($validated);

        // Update product stock
        $product = Product::findOrFail($validated['product_id']);
        if (in_array($validated['type'], ['in', 'return', 'adjustment']) && $validated['quantity'] > 0) {
            $product->stock_quantity += abs($validated['quantity']);
        } elseif (in_array($validated['type'], ['out', 'sale']) || $validated['quantity'] < 0) {
            $product->stock_quantity -= abs($validated['quantity']);
        }
        $product->save();

        return redirect()->route('stocks.index')->with('success', 'Mouvement de stock créé avec succès.');
    }

    public function show(StockMovement $stock): Response
    {
        $stock->load(['shop', 'product', 'user']);
        return Inertia::render('Stocks/Show', ['movement' => $stock]);
    }

    public function destroy(StockMovement $stock): RedirectResponse
    {
        $product = $stock->product;
        if (in_array($stock->type, ['in', 'return']) || $stock->quantity > 0) {
            $product->stock_quantity -= abs($stock->quantity);
        } else {
            $product->stock_quantity += abs($stock->quantity);
        }
        $product->save();
        $stock->delete();

        return redirect()->route('stocks.index')->with('success', 'Mouvement supprimé et stock ajusté.');
    }
}
