<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $shopId = $request->input('shop_id');
        $status = $request->input('status');
        $search = $request->input('search');
        
        $query = Sale::with(['shop', 'user', 'customer', 'items'])
            ->orderBy('sale_date', 'desc');

        if ($shopId) {
            $query->where('shop_id', $shopId);
        } else {
            $query->whereHas('shop', function ($q) {
                $q->where('user_id', Auth::id());
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where('ticket_number', 'like', "%{$search}%");
        }

        $sales = $query->paginate(20);

        $stats = [
            'total_revenue' => Sale::where('status', 'completed')->sum('total'),
            'total_sales' => Sale::where('status', 'completed')->count(),
        ];

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'shops' => Auth::user()->shops,
            'filters' => $request->only(['shop_id', 'status', 'search']),
            'stats' => $stats,
        ]);
    }

    public function create(): Response
    {
        $shops = Auth::user()->shops;
        
        $customers = Customer::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->get();
        
        $products = Product::whereHas('shop', function ($q) {
            $q->where('user_id', Auth::id());
        })->where('is_active', true)->get();

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
        ]);

        $shop = Auth::user()->shops()->findOrFail($validated['shop_id']);
        
        DB::transaction(function () use ($validated, $shop) {
            $items = $validated['items'];
            unset($validated['items']);
            
            $validated['user_id'] = Auth::id();
            $validated['status'] = 'completed';
            
            $sale = $shop->sales()->create($validated);
            
            foreach ($items as $itemData) {
                $product = Product::find($itemData['product_id']);
                
                $sale->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $product->selling_price,
                    'tax_rate' => $product->tax_rate ?? 0,
                    'discount_amount' => 0,
                ]);
            }
        });

        return redirect()->route('sales.index')->with('success', 'Vente enregistrée avec succès.');
    }

    public function show(Sale $sale)
    {
        $sale->load(['shop', 'user', 'customer', 'items.product', 'returns']);
        
        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }

    public function destroy(Sale $sale)
    {
        if ($sale->shop->user_id !== Auth::id()) {
            abort(403);
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

        return redirect()->route('sales.index')->with('success', 'Vente annulée avec succès.');
    }
}
