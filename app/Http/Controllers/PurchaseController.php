<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Shop;
use App\Services\ActivityLogger;
use App\Services\StockMovementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    /**
     * Display a listing of purchases.
     */
    public function index(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        $codeUser = $request->route('code_user');

        if (!$activeShopId) {
            return redirect()->route('dashboard', ['code_user' => $codeUser])
                ->with('error', 'Veuillez sélectionner une boutique.');
        }

        $query = Purchase::where('shop_id', $activeShopId)
            ->with(['supplier', 'user', 'items']);

        // Filtres
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%");
                  });
            });
        }

        $purchases = $query->orderBy('order_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        $suppliers = Supplier::whereHas('shops', function ($q) use ($activeShopId) {
            $q->where('shops.id', $activeShopId);
        })->where('is_active', true)->get();

        $shop = Shop::find($activeShopId);

        return Inertia::render('Purchases/Index', [
            'code_user' => $codeUser,
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'currency' => $shop->currency,
            'filters' => $request->only(['status', 'supplier_id', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new purchase.
     */
    public function create(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        $codeUser = $request->route('code_user');

        if (!$activeShopId) {
            return redirect()->route('dashboard', ['code_user' => $codeUser])
                ->with('error', 'Veuillez sélectionner une boutique.');
        }

        $shop = Shop::find($activeShopId);

        $suppliers = Supplier::whereHas('shops', function ($q) use ($activeShopId) {
            $q->where('shops.id', $activeShopId);
        })->where('is_active', true)->get();

        $products = Product::where('shop_id', $activeShopId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with(['category'])
            ->get();

        return Inertia::render('Purchases/Create', [
            'code_user' => $codeUser,
            'suppliers' => $suppliers,
            'products' => $products,
            'currency' => $shop->currency,
        ]);
    }

    /**
     * Store a newly created purchase.
     */
    public function store(Request $request): RedirectResponse
    {
        $activeShopId = get_active_shop_id();
        $codeUser = $request->route('code_user');

        if (!$activeShopId) {
            return back()->with('error', 'Veuillez sélectionner une boutique.');
        }

        $validated = $request->validate([
            'supplier_id' => [
                'required',
                Rule::exists('suppliers', 'id')->whereExists(function ($q) use ($activeShopId) {
                    $q->select(DB::raw(1))
                        ->from('shop_supplier')
                        ->whereColumn('shop_supplier.supplier_id', 'suppliers.id')
                        ->where('shop_supplier.shop_id', $activeShopId);
                }),
            ],
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'shipping_cost' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id')->where('shop_id', $activeShopId),
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        $shop = Shop::find($activeShopId);

        DB::beginTransaction();
        try {
            // Calculer les taux globaux
            $globalTaxRate = $validated['tax_rate'] ?? 0;
            $globalDiscountRate = $validated['discount_rate'] ?? 0;

            $purchase = Purchase::create([
                'shop_id' => $activeShopId,
                'supplier_id' => $validated['supplier_id'],
                'user_id' => Auth::id(),
                'order_date' => $validated['order_date'],
                'expected_date' => $validated['expected_date'] ?? null,
                'shipping_cost' => $validated['shipping_cost'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'internal_notes' => $validated['internal_notes'] ?? null,
                'currency' => $shop->currency,
                'status' => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity_ordered' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $globalTaxRate,
                    'discount_rate' => $globalDiscountRate,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $purchase->calculateTotals();

            ActivityLogger::message(
                'purchase_created',
                'purchase_created',
                ['reference' => $purchase->reference],
                $purchase,
                ['supplier' => $purchase->supplier->name]
            );

            DB::commit();

            return redirect()
                ->route('purchases.show', ['code_user' => $codeUser, 'purchase' => $purchase->id])
                ->with('success', 'Bon de commande créé avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Erreur lors de la création: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified purchase.
     */
    public function show(Request $request, string $codeUser, Purchase $purchase): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $purchase->shop_id)->exists()) {
            abort(403);
        }

        $purchase->load(['supplier', 'user', 'items.product', 'shop']);

        return Inertia::render('Purchases/Show', [
            'code_user' => $codeUser,
            'purchase' => $purchase,
        ]);
    }

    /**
     * Show the form for editing the specified purchase.
     */
    public function edit(Request $request, string $codeUser, Purchase $purchase): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $purchase->shop_id)->exists()) {
            abort(403);
        }

        $activeShopId = get_active_shop_id();

        if (!$activeShopId) {
            return redirect()->route('dashboard', ['code_user' => $codeUser])
                ->with('error', 'Veuillez sélectionner une boutique.');
        }

        $shop = Shop::find($activeShopId);

        if ($purchase->status !== 'draft') {
            return redirect()
                ->route('purchases.show', ['code_user' => $codeUser, 'purchase' => $purchase->id])
                ->with('error', 'Seuls les bons de commande en brouillon peuvent être modifiés.');
        }

        $purchase->load(['items.product']);

        $suppliers = Supplier::whereHas('shops', function ($q) use ($activeShopId) {
            $q->where('shops.id', $activeShopId);
        })->where('is_active', true)->get();

        $products = Product::where('shop_id', $activeShopId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with(['category'])
            ->get();

        return Inertia::render('Purchases/Edit', [
            'code_user' => $codeUser,
            'purchase' => $purchase,
            'suppliers' => $suppliers,
            'products' => $products,
            'currency' => $shop->currency,
        ]);
    }

    /**
     * Update the specified purchase.
     */
    public function update(Request $request, string $codeUser, Purchase $purchase): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $purchase->shop_id)->exists()) {
            abort(403);
        }

        if ($purchase->status !== 'draft') {
            return back()->with('error', 'Seuls les bons de commande en brouillon peuvent être modifiés.');
        }

        $validated = $request->validate([
            'supplier_id' => [
                'required',
                Rule::exists('suppliers', 'id')->whereExists(function ($q) use ($purchase) {
                    $q->select(DB::raw(1))
                        ->from('shop_supplier')
                        ->whereColumn('shop_supplier.supplier_id', 'suppliers.id')
                        ->where('shop_supplier.shop_id', $purchase->shop_id);
                }),
            ],
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'shipping_cost' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id')->where('shop_id', $purchase->shop_id),
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Calculer les taux globaux
            $globalTaxRate = $validated['tax_rate'] ?? 0;
            $globalDiscountRate = $validated['discount_rate'] ?? 0;

            $purchase->update([
                'supplier_id' => $validated['supplier_id'],
                'order_date' => $validated['order_date'],
                'expected_date' => $validated['expected_date'] ?? null,
                'shipping_cost' => $validated['shipping_cost'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'internal_notes' => $validated['internal_notes'] ?? null,
            ]);

            $purchase->items()->delete();

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity_ordered' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $globalTaxRate,
                    'discount_rate' => $globalDiscountRate,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            $purchase->calculateTotals();

            ActivityLogger::message('purchase_updated', 'purchase_updated', ['reference' => $purchase->reference], $purchase);

            DB::commit();

            return redirect()
                ->route('purchases.show', ['code_user' => $codeUser, 'purchase' => $purchase->id])
                ->with('success', 'Bon de commande modifié avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Erreur lors de la modification: ' . $e->getMessage());
        }
    }

    /**
     * Confirm a purchase order
     */
    public function confirm(Request $request, string $codeUser, Purchase $purchase): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $purchase->shop_id)->exists()) {
            abort(403);
        }

        if ($purchase->status !== 'draft') {
            return back()->with('error', 'Seuls les bons de commande en brouillon peuvent être confirmés.');
        }

        $purchase->update(['status' => 'confirmed']);

        ActivityLogger::message('purchase_confirmed', 'purchase_confirmed', ['reference' => $purchase->reference], $purchase);

        return redirect()
            ->route('purchases.show', ['code_user' => $codeUser, 'purchase' => $purchase->id])
            ->with('success', 'Bon de commande confirmé avec succès.');
    }

    /**
     * Receive items from a purchase
     */
    public function receive(Request $request, string $codeUser, Purchase $purchase): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $purchase->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => [
                'required',
                Rule::exists('purchase_items', 'id')->where('purchase_id', $purchase->id),
            ],
            'items.*.quantity' => 'required|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['items'] as $itemData) {
                $item = PurchaseItem::find($itemData['id']);
                $quantityToReceive = $itemData['quantity'];

                if ($quantityToReceive > 0) {
                    $item->quantity_received += $quantityToReceive;
                    $item->save();

                    StockMovementService::recordPurchaseReceipt(
                        $item->product,
                        $quantityToReceive,
                        $item->unit_price,
                        $purchase->shop_id,
                        $purchase,
                        "Réception du bon de commande {$purchase->reference}"
                    );
                }
            }

            if ($purchase->isFullyReceived()) {
                $purchase->status = 'received';
                $purchase->received_date = now();
            } elseif ($purchase->isPartiallyReceived()) {
                $purchase->status = 'partial';
            }
            $purchase->save();

            ActivityLogger::message('purchase_received', 'purchase_received', ['reference' => $purchase->reference], $purchase);

            DB::commit();

            return redirect()
                ->route('purchases.show', ['code_user' => $codeUser, 'purchase' => $purchase->id])
                ->with('success', 'Réception enregistrée avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Erreur lors de la réception: ' . $e->getMessage());
        }
    }

    /**
     * Cancel a purchase
     */
    public function cancel(Request $request, string $codeUser, Purchase $purchase): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $purchase->shop_id)->exists()) {
            abort(403);
        }

        if ($purchase->status === 'cancelled') {
            return back()->with('error', 'Ce bon de commande est déjà annulé.');
        }

        if ($purchase->status === 'received') {
            return back()->with('error', 'Impossible d\'annuler un bon de commande déjà reçu.');
        }

        $purchase->update(['status' => 'cancelled']);

        ActivityLogger::message('purchase_cancelled', 'purchase_cancelled', ['reference' => $purchase->reference], $purchase);

        return redirect()
            ->route('purchases.show', ['code_user' => $codeUser, 'purchase' => $purchase->id])
            ->with('success', 'Bon de commande annulé avec succès.');
    }

    /**
     * Remove the specified purchase.
     */
    public function destroy(Request $request, string $codeUser, Purchase $purchase): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $purchase->shop_id)->exists()) {
            abort(403);
        }

        if (!in_array($purchase->status, ['draft', 'cancelled'])) {
            return back()->with('error', 'Seuls les bons de commande en brouillon ou annulés peuvent être supprimés.');
        }

        $reference = $purchase->reference;
        $purchase->delete();

        ActivityLogger::message('purchase_deleted', 'purchase_deleted', ['reference' => $reference]);

        return redirect()
            ->route('purchases.index', ['code_user' => $codeUser])
            ->with('success', 'Bon de commande supprimé avec succès.');
    }
}
