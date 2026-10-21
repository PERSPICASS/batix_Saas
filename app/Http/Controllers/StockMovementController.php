<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use App\Models\Shop;
use App\Models\Product;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class StockMovementController extends Controller
{
    public function index(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        
        $shops = Auth::user()->accessibleShops();
        $shopIds = $shops->pluck('id');
        
        $query = StockMovement::with(['shop', 'product', 'user'])
            ->whereIn('shop_id', $shopIds)
            ->when($activeShopId, function ($q) use ($activeShopId) {
                $q->where('shop_id', $activeShopId);
            })
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
            'shops' => $shops,
            'filters' => $request->only(['search', 'type', 'shop_id', 'date_from', 'date_to']),
        ]);
    }

    public function create(): Response
    {
        $shops = Auth::user()->accessibleShops();
        $shopIds = $shops->pluck('id');
        
        $products = Product::with('shop')
            ->where('is_active', true)
            ->whereIn('shop_id', $shopIds)
            ->get();

        return Inertia::render('Stocks/Create', [
            'shops' => $shops,
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $request->input('shop_id'))->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'product_id' => [
                'required',
                Rule::exists('products', 'id')->where('shop_id', $request->input('shop_id')),
            ],
            'type' => 'required|in:in,out,transfer,adjustment',
            'quantity' => 'required|integer|not_in:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'movement_date' => 'required|date',
        ]);

        DB::transaction(function () use ($validated) {
            $product = Product::findOrFail($validated['product_id']);
            StockMovementService::recordManualAdjustment(
                $product,
                (int) $validated['quantity'],
                $validated['type'],
                (int) $validated['shop_id'],
                $validated['notes'] ?? null,
                $validated['movement_date'],
                isset($validated['unit_cost']) ? (float) $validated['unit_cost'] : null
            );
        });

        return redirect()->route('stocks.index', ['code_user' => request()->route('code_user')])->with('success', 'Mouvement de stock créé avec succès.');
    }

    public function show(string $code_user, StockMovement $stockMovement): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $stockMovement->shop_id)->exists()) {
            abort(403);
        }

        $stockMovement->load(['shop', 'product', 'user']);
        return Inertia::render('Stocks/Show', ['movement' => $stockMovement]);
    }

    public function destroy(string $code_user, StockMovement $stockMovement): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $stockMovement->shop_id)->exists()) {
            abort(403);
        }

        DB::transaction(function () use ($stockMovement) {
            StockMovementService::reverseMovement($stockMovement);
            $stockMovement->delete();
        });

        return redirect()->route('stocks.index', ['code_user' => request()->route('code_user')])->with('success', 'Mouvement supprimé et stock ajusté.');
    }
}
