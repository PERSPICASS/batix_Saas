<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $activeShopId = get_active_shop_id();
        $shopId = $request->input('shop_id');
        $status = $request->input('status');
        $search = $request->input('search');
        
        $shops = $user->accessibleShops();
        $shopIds = $shops->pluck('id');
        
        $query = Sale::with(['shop', 'user', 'customer', 'items'])
            ->whereIn('shop_id', $shopIds)
            ->orderBy('sale_date', 'desc');

        // Les caissiers ne voient que leurs propres ventes
        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            $query->where('user_id', $user->id);
        }

        // Filtrer par boutique active si sélectionnée
        if ($activeShopId) {
            $query->where('shop_id', $activeShopId);
        } elseif ($shopId) {
            $query->where('shop_id', $shopId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where('ticket_number', 'like', "%{$search}%");
        }

        $sales = $query->paginate(20);

        // Calculer les statistiques en fonction de la boutique active
        $statsQuery = Sale::where('status', 'completed')
            ->whereIn('shop_id', $shopIds);
        
        // Les caissiers ne voient que leurs propres stats
        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            $statsQuery->where('user_id', $user->id);
        }
        
        if ($activeShopId) {
            $statsQuery->where('shop_id', $activeShopId);
        }

        $stats = [
            'total_revenue' => $statsQuery->sum('total'),
            'total_sales' => $statsQuery->count(),
        ];

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'shops' => $shops,
            'filters' => $request->only(['shop_id', 'status', 'search']),
            'stats' => $stats,
        ]);
    }

    public function create(): Response
    {
        $shops = Auth::user()->accessibleShops();
        $shopIds = $shops->pluck('id');
        
        $customers = Customer::whereIn('shop_id', $shopIds)->get();
        
        $products = Product::whereIn('shop_id', $shopIds)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Sales/Create', [
            'shops' => $shops,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'required|in:cash,card,transfer,check,mobile,multiple',
            'amount_paid' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0', // Prix négocié
        ]);

        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        
        $sale = DB::transaction(function () use ($validated, $shop) {
            $items = $validated['items'];
            unset($validated['items']);
            
            $validated['user_id'] = Auth::id();
            $validated['status'] = 'completed';
            
            $sale = $shop->sales()->create($validated);
            
            foreach ($items as $itemData) {
                $product = Product::find($itemData['product_id']);
                
                // Utiliser le prix négocié envoyé par le frontend
                $unitPrice = $itemData['unit_price'];
                
                $sale->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $unitPrice, // Prix négocié
                    'tax_rate' => $product->tax_rate ?? 0,
                    'discount_amount' => 0,
                ]);
            }
            
            return $sale;
        });

        // Log activity
        ActivityLogger::created($sale, "Vente enregistrée: {$sale->ticket_number}");

        return redirect()->route('sales.index', ['code_user' => request()->route('code_user')])->with('success', 'Vente enregistrée avec succès.');
    }

    public function show(string $code_user, Sale $sale)
    {
        $sale->load(['shop', 'user', 'customer', 'items.product', 'returns']);
        
        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }

    public function destroy(string $code_user, Sale $sale)
    {
        if ($sale->shop->user_id !== Auth::id()) {
            abort(403);
        }
        
        // Les caissiers ne peuvent pas annuler de ventes
        $user = Auth::user();
        if (in_array($user->role, ['cashier', 'caisse'])) {
            return back()->with('error', 'Vous n\'avez pas l\'autorisation d\'annuler des ventes.');
        }

        if (!$sale->sale_date->isToday()) {
            return back()->with('error', 'Vous ne pouvez annuler que les ventes du jour.');
        }

        DB::transaction(function () use ($sale) {
            foreach ($sale->items as $item) {
                if ($item->product && $item->product->track_stock) {
                    $item->product->increment('stock_quantity', $item->quantity);
                }
            }
            
            $sale->update(['status' => 'cancelled']);
        });

        return redirect()->route('sales.index', ['code_user' => request()->route('code_user')])->with('success', 'Vente annulée avec succès.');
    }
}
