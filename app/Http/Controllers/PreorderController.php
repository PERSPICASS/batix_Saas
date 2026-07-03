<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Preorder;
use App\Models\Product;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
            ? Product::where('shop_id', $activeShopId)
                ->where('is_active', true)
                ->whereNull('parent_id')
                ->with(['variations' => fn($q) => $q->where('is_active', true)->orderBy('name')])
                ->get()
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
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity_ordered' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.expected_delivery_date' => 'required|date|after:today',
            'items.*.deposit_amount' => 'nullable|numeric|min:0',
        ]);

        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);

        $productIds = collect($validated['items'])->pluck('product_id')->unique();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        foreach ($productIds as $productId) {
            $product = $products->get($productId);
            if (!$product || $product->shop_id !== (int) $validated['shop_id']) {
                return back()->withErrors(['items' => 'Un des produits sélectionnés ne fait pas partie de cette boutique.'])->withInput();
            }
        }

        $preorders = DB::transaction(function () use ($validated) {
            return collect($validated['items'])->map(function ($item) use ($validated) {
                return Preorder::create([
                    'shop_id' => $validated['shop_id'],
                    'customer_id' => $validated['customer_id'],
                    'user_id' => Auth::id(),
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity_ordered'],
                    'unit_price' => $item['unit_price'],
                    'expected_delivery_date' => $item['expected_delivery_date'],
                    'deposit_amount' => $item['deposit_amount'] ?? 0,
                    'notes' => $validated['notes'] ?? null,
                ]);
            });
        });

        $productNames = $preorders->map(fn ($p) => $products->get($p->product_id)->name)->implode(', ');
        ActivityLogger::message('preorder_batch_created', 'preorder_batch_created', ['products' => $productNames]);

        $message = $preorders->count() > 1
            ? "{$preorders->count()} pré-commandes enregistrées avec succès."
            : 'Pré-commande enregistrée avec succès.';

        return redirect()->route('preorders.index')->with('success', $message);
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

    public function updateStatus(Request $request, string $code_user, Preorder $preorder)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'manager'])) {
            abort(403);
        }

        if (!$user->accessibleShopsQuery()->where('id', $preorder->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,ready,completed,cancelled',
        ]);

        $oldStatus = $preorder->status;
        $preorder->update(['status' => $validated['status']]);

        // 'old'/'new' sont les valeurs brutes du statut (pending, ready…) : elles sont
        // traduites à la LECTURE (voir ActivityLog::getTranslatedDescriptionAttribute()),
        // pas à l'écriture, pour que le message s'affiche dans la langue du lecteur, pas
        // dans celle de la personne qui a changé le statut.
        ActivityLogger::message(
            'update',
            'preorder_status_changed',
            ['old' => $oldStatus, 'new' => $validated['status']],
            $preorder,
            ['changes' => ['status' => ['old' => $oldStatus, 'new' => $validated['status']]]]
        );

        return back()->with('success', 'Statut mis à jour.');
    }

    public function convertToSale(string $code_user, Preorder $preorder)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'manager', 'cashier', 'caisse'])) {
            abort(403);
        }

        if (!$user->accessibleShopsQuery()->where('id', $preorder->shop_id)->exists()) {
            abort(403);
        }

        if ($preorder->status === 'completed' || $preorder->status === 'cancelled') {
            return back()->with('error', 'Cette pré-commande ne peut pas être convertie en vente.');
        }

        ActivityLogger::message('preorder_to_sale', 'preorder_to_sale', ['product' => $preorder->product->name], $preorder);

        return redirect()->route('sales.create', [
            'code_user' => $code_user,
            'preorder_id' => $preorder->id,
        ])->with('success', 'Pré-commande convertie en vente. Complétez les détails.');
    }
}
