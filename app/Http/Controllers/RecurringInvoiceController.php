<?php

namespace App\Http\Controllers;

use App\Models\RecurringInvoice;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Shop;
use App\Traits\ResolvesTaxRate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class RecurringInvoiceController extends Controller
{
    use ResolvesTaxRate;

    /**
     * Resolve the shop this request should operate on: the active shop selected in
     * session, scoped to shops the current user can actually access (owner, manager,
     * or employee — not just shops they personally own via Shop.user_id).
     */
    private function resolveActiveShop(): Shop
    {
        $activeShopId = get_active_shop_id();
        $shop = $activeShopId
            ? Auth::user()->accessibleShopsQuery()->find($activeShopId)
            : null;

        abort_unless($shop, 403, 'Veuillez sélectionner une boutique.');

        return $shop;
    }

    public function index(string $code_user, Request $request): Response
    {
        $shop = $this->resolveActiveShop();

        $query = RecurringInvoice::with('customer')
            ->where('shop_id', $shop->id);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('invoice_prefix', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            if ($request->input('status') === 'active') {
                $query->active();
            } elseif ($request->input('status') === 'expired') {
                $query->expired();
            }
        }

        $recurringInvoices = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('RecurringInvoices/Index', [
            'recurringInvoices' => $recurringInvoices,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(string $code_user): Response
    {
        $shop = $this->resolveActiveShop();

        $customers = Customer::where('shop_id', $shop->id)
            ->get(['id', 'name', 'email']);

        $products = Product::where('shop_id', $shop->id)
            ->get(['id', 'name', 'selling_price', 'tax_rate']);

        return Inertia::render('RecurringInvoices/Create', [
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function store(Request $request, string $code_user): RedirectResponse
    {
        $shop = $this->resolveActiveShop();

        $validated = $request->validate([
            'customer_id' => [
                'required',
                \Illuminate\Validation\Rule::exists('customers', 'id')->where('shop_id', $shop->id),
            ],
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'frequency' => 'required|in:monthly,quarterly,semi-annual,annual',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                \Illuminate\Validation\Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $subtotal = collect($validated['items'])->sum(function ($item) {
            return $item['quantity'] * $item['unit_price'];
        });

        // Le taux vient du produit, sinon de la boutique — jamais d'un 18 en dur, qui
        // ignorait le taux configuré dans les Réglages. Le total se somme ligne à ligne,
        // sans quoi il contredirait le détail dès que deux lignes n'ont pas le même taux.
        $taxAmount = $this->taxAmountFor($validated['items'], $shop);
        $total = $subtotal + $taxAmount;

        $recurringInvoice = RecurringInvoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $validated['customer_id'],
            'user_id' => auth()->id(),
            'invoice_prefix' => 'REC-' . now()->format('Ym'),
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'frequency' => $validated['frequency'],
            'next_invoice_date' => $validated['start_date'],
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
        ]);

        foreach ($validated['items'] as $item) {
            $recurringInvoice->items()->create([
                'product_id' => $item['product_id'],
                'product_name' => Product::find($item['product_id'])->name,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'tax_rate' => $this->taxRateFor($item['product_id'] ?? null, $shop),
            ]);
        }

        return redirect()->route('recurring-invoices.show', ['code_user' => $code_user, 'recurring_invoice' => $recurringInvoice])->with('success', 'Facture récurrente créée avec succès');
    }

    public function show(string $code_user, RecurringInvoice $recurringInvoice): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $recurringInvoice->shop_id)->exists()) {
            abort(403);
        }

        $recurringInvoice->load('customer', 'items.product', 'invoices');

        return Inertia::render('RecurringInvoices/Show', [
            'recurringInvoice' => $recurringInvoice,
        ]);
    }

    public function edit(string $code_user, RecurringInvoice $recurringInvoice): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $recurringInvoice->shop_id)->exists()) {
            abort(403);
        }

        $recurringInvoice->load('customer', 'items.product');

        // Format dates for input type="date" (YYYY-MM-DD)
        $recurringData = $recurringInvoice->toArray();
        $recurringData['start_date'] = $recurringInvoice->start_date->format('Y-m-d');
        if ($recurringInvoice->end_date) {
            $recurringData['end_date'] = $recurringInvoice->end_date->format('Y-m-d');
        }
        $recurringData['next_invoice_date'] = $recurringInvoice->next_invoice_date->format('Y-m-d');
        $recurringData['customer'] = $recurringInvoice->customer->toArray();
        $recurringData['items'] = $recurringInvoice->items->map(fn($item) => array_merge($item->toArray(), [
            'product' => $item->product->toArray(),
        ]))->toArray();

        $customers = Customer::where('shop_id', $recurringInvoice->shop_id)
            ->get(['id', 'name']);

        $products = Product::where('shop_id', $recurringInvoice->shop_id)
            ->get(['id', 'name', 'selling_price', 'tax_rate']);

        return Inertia::render('RecurringInvoices/Edit', [
            'recurringInvoice' => $recurringData,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function update(Request $request, string $code_user, RecurringInvoice $recurringInvoice): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $recurringInvoice->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'frequency' => 'required|in:monthly,quarterly,semi-annual,annual',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                \Illuminate\Validation\Rule::exists('products', 'id')->where('shop_id', $recurringInvoice->shop_id),
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $subtotal = collect($validated['items'])->sum(function ($item) {
            return $item['quantity'] * $item['unit_price'];
        });

        $taxAmount = $this->taxAmountFor($validated['items'], $recurringInvoice->shop);
        $total = $subtotal + $taxAmount;

        $recurringInvoice->update([
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'frequency' => $validated['frequency'],
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Delete old items and create new ones
        $recurringInvoice->items()->delete();
        foreach ($validated['items'] as $item) {
            $recurringInvoice->items()->create([
                'product_id' => $item['product_id'],
                'product_name' => Product::find($item['product_id'])->name,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'tax_rate' => $this->taxRateFor($item['product_id'] ?? null, $recurringInvoice->shop),
            ]);
        }

        return redirect()->route('recurring-invoices.show', ['code_user' => $code_user, 'recurring_invoice' => $recurringInvoice])->with('success', 'Facture récurrente mise à jour');
    }

    public function generateNow(string $code_user, RecurringInvoice $recurringInvoice): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $recurringInvoice->shop_id)->exists()) {
            abort(403);
        }

        $recurringInvoice->load('items.product');
        $invoice = $recurringInvoice->generateNextInvoice();

        return redirect()->route('invoices.show', ['code_user' => $code_user, 'invoice' => $invoice])->with('success', 'Facture générée avec succès');
    }

    public function toggleActive(string $code_user, RecurringInvoice $recurringInvoice): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $recurringInvoice->shop_id)->exists()) {
            abort(403);
        }

        $recurringInvoice->update([
            'is_active' => !$recurringInvoice->is_active,
        ]);

        return redirect()->back()->with('success', $recurringInvoice->is_active ? 'Facture récurrente réactivée' : 'Facture récurrente désactivée');
    }

    public function destroy(string $code_user, RecurringInvoice $recurringInvoice): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $recurringInvoice->shop_id)->exists()) {
            abort(403);
        }

        $recurringInvoice->delete();

        return redirect()->route('recurring-invoices.index', ['code_user' => $code_user])->with('success', 'Facture récurrente supprimée');
    }
}
