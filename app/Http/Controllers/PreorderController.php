<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Preorder;
use App\Models\Product;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PreorderController extends Controller
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

        $query = Preorder::with(['shop', 'customer', 'product', 'user'])
            ->whereIn('shop_id', $shopIds)
            ->orderBy('expected_delivery_date', 'asc');

        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            $query->where('user_id', $user->id);
        }

        if ($activeShopId) {
            $query->where('shop_id', $activeShopId);
        } elseif ($shopId) {
            $query->where('shop_id', $shopId);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', fn($p) => $p->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        $preorders = $query->paginate(20)->withQueryString();

        return Inertia::render('Preorders/Index', [
            'preorders' => $preorders,
            'shops' => $shops,
            'filters' => $request->only(['search', 'status', 'shop_id']),
        ]);
    }

    public function create(): Response
    {
        $activeShopId = get_active_shop_id();
        $shops = Auth::user()->accessibleShops();
        $customers = $activeShopId
            ? Customer::where('shop_id', $activeShopId)->get()
            : collect([]);
        $products = $activeShopId
            ? Product::where('shop_id', $activeShopId)->where('is_active', true)->get()
            : collect([]);

        return Inertia::render('Preorders/Create', [
            'shops' => $shops,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'required|exists:products,id',
            'quantity_ordered' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'expected_delivery_date' => 'required|date|after:today',
            'deposit_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        $product = Product::findOrFail($validated['product_id']);

        if ($product->shop_id !== $validated['shop_id']) {
            return back()->withErrors(['product_id' => 'Ce produit ne fait pas partie de cette boutique.'])->withInput();
        }

        $preorder = Preorder::create([
            ...$validated,
            'user_id' => Auth::id(),
            'deposit_amount' => $validated['deposit_amount'] ?? 0,
        ]);

        ActivityLogger::created($preorder, "Pré-commande créée pour {$product->name}");

        return redirect()->route('preorders.index')->with('success', 'Pré-commande enregistrée avec succès.');
    }

    public function show(string $code_user, Preorder $preorder)
    {
        $user = Auth::user();
        if (!$user->accessibleShopsQuery()->where('id', $preorder->shop_id)->exists()) {
            abort(403);
        }

        $preorder->load(['customer', 'product', 'shop', 'user']);

        return Inertia::render('Preorders/Show', ['preorder' => $preorder]);
    }

    public function updateStatus(Request $request, Preorder $preorder)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'manager'])) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,ready,completed,cancelled',
        ]);

        $oldStatus = $preorder->status;
        $preorder->update(['status' => $validated['status']]);

        ActivityLogger::updated($preorder, "Statut pré-commande changé: {$oldStatus} → {$validated['status']}");

        return back()->with('success', 'Statut mis à jour.');
    }

    public function convertToSale(Preorder $preorder)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'manager', 'cashier', 'caisse'])) {
            abort(403);
        }

        if ($preorder->status === 'completed' || $preorder->status === 'cancelled') {
            return back()->with('error', 'Cette pré-commande ne peut pas être convertie en vente.');
        }

        ActivityLogger::log('preorder_to_sale', "Pré-commande convertie en vente: {$preorder->product->name}");

        return redirect()->route('sales.create', [
            'code_user' => request()->route('code_user'),
            'preorder_id' => $preorder->id,
        ])->with('success', 'Pré-commande convertie en vente. Complétez les détails.');
    }
}
