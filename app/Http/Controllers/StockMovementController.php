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
                    $q->whereContains('name', $search)
                      ->orWhereContains('sku', $search);
                });
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Historique d'un produit (lien « Voir tout l'historique » de la fiche produit).
        $product = null;
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
            $product = Product::whereIn('shop_id', $shopIds)->select('id', 'name')->find($request->product_id);
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
            'product' => $product,
            'filters' => (object) $request->only(['search', 'type', 'shop_id', 'product_id', 'date_from', 'date_to']),
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
            'reasons' => StockMovement::REASONS,
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
            // Plus de « Transfert » ni d'« Ajustement » manuels : le premier ne touchait pas
            // au stock, le second double la correction de la fiche produit et l'inventaire.
            'type' => 'required|in:in,out',
            'reason' => ['required', Rule::in(StockMovement::REASONS[$request->input('type')] ?? [])],
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'movement_date' => 'required|date',
        ]);

        $error = DB::transaction(function () use ($validated) {
            $product = Product::whereKey($validated['product_id'])->lockForUpdate()->firstOrFail();

            // La base refuse un stock négatif : sans ce contrôle, la sortie levait un 500.
            if ($validated['type'] === 'out' && $product->stock_quantity < $validated['quantity']) {
                return "Stock insuffisant : il ne reste que {$product->stock_quantity} unité(s) de « {$product->name} ».";
            }

            StockMovementService::recordManualAdjustment(
                $product,
                (int) $validated['quantity'],
                $validated['type'],
                (int) $validated['shop_id'],
                $validated['notes'] ?? null,
                $validated['movement_date'],
                isset($validated['unit_cost']) ? (float) $validated['unit_cost'] : null,
                $validated['reason']
            );

            return null;
        });

        if ($error) {
            return back()->withErrors(['quantity' => $error])->withInput();
        }

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

        if (!$stockMovement->is_manual) {
            return back()->with('error', "Ce mouvement vient d'une vente, d'un document ou d'un dépôt : "
                . "annulez-le depuis son origine. Pour corriger le stock, faites une entrée ou une sortie.");
        }

        $error = DB::transaction(function () use ($stockMovement) {
            // Annuler une entrée retire la quantité du stock : si elle a été vendue depuis,
            // le stock passerait en négatif et la contrainte de la base levait un 500.
            $product = Product::whereKey($stockMovement->product_id)->lockForUpdate()->first();

            if ($product && $stockMovement->quantity > 0 && $product->stock_quantity < $stockMovement->quantity) {
                return "Impossible de supprimer ce mouvement : il retirerait {$stockMovement->quantity} unité(s) de « {$product->name} », "
                    . "dont le stock n'est plus que de {$product->stock_quantity}. Faites plutôt une sortie.";
            }

            StockMovementService::reverseMovement($stockMovement);
            $stockMovement->delete();

            return null;
        });

        if ($error) {
            return back()->with('error', $error);
        }

        return redirect()->route('stocks.index', ['code_user' => request()->route('code_user')])->with('success', 'Mouvement supprimé et stock ajusté.');
    }
}
