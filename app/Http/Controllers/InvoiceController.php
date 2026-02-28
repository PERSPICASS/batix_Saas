<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        $shopId = $request->input('shop_id');
        $status = $request->input('status');
        $search = $request->input('search');
        
        $shops = Auth::user()->accessibleShops();
        $shopIds = $shops->pluck('id');
        
        $query = Invoice::with(['shop', 'customer', 'user'])
            ->whereIn('shop_id', $shopIds)
            ->orderBy('invoice_date', 'desc');

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
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $invoices = $query->paginate(20);

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'shops' => $shops,
            'filters' => $request->only(['shop_id', 'status', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $shops = Auth::user()->accessibleShops();
        $shopIds = $shops->pluck('id');
        
        $customers = Customer::whereIn('shop_id', $shopIds)
            ->with('shop')
            ->get();
        
        $products = Product::whereIn('shop_id', $shopIds)
            ->with(['shop', 'category'])
            ->get();

        return Inertia::render('Invoices/Create', [
            'shops' => $shops,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'customer_id' => [
                'required',
                Rule::exists('customers', 'id')->where(function ($query) use ($request) {
                    $query->where('shop_id', $request->input('shop_id'));
                }),
            ],
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'status' => 'required|in:draft,sent,paid,cancelled',
            'payment_method' => 'nullable|in:cash,card,transfer,check,mobile',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        
        $invoice = DB::transaction(function () use ($validated, $shop) {
            $items = $validated['items'];
            unset($validated['items']);
            
            $validated['user_id'] = Auth::id();
            
            $invoice = $shop->invoices()->create($validated);
            
            foreach ($items as $item) {
                $invoice->items()->create($item);
            }
            
            // Le calcul des totaux se fait automatiquement via les observers
            
            return $invoice;
        });

        // Log activity
        ActivityLogger::created($invoice, "Facture créée: {$invoice->invoice_number}");

        return redirect()->route('invoices.index', ['code_user' => request()->route('code_user')])->with('success', 'Facture créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Invoice $invoice)
    {
        $invoice->load(['shop', 'customer', 'user', 'items.product']);
        
        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $code_user, Invoice $invoice): Response
    {
        // Ne pas permettre la modification des factures payées
        if ($invoice->status === 'paid') {
            return redirect()->route('invoices.show', $invoice)
                ->with('error', 'Impossible de modifier une facture payée.');
        }
        
        $shops = Auth::user()->accessibleShops();
        $shopIds = $shops->pluck('id');
        
        $customers = Customer::whereIn('shop_id', $shopIds)
            ->with('shop')
            ->get();
        
        $products = Product::whereIn('shop_id', $shopIds)
            ->with(['shop', 'category'])
            ->get();
        
        $invoice->load('items');
        
        return Inertia::render('Invoices/Edit', [
            'invoice' => $invoice,
            'shops' => $shops,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $code_user, Invoice $invoice)
    {
        // Ne pas permettre la modification des factures payées
        if ($invoice->status === 'paid') {
            return redirect()->route('invoices.show', $invoice)
                ->with('error', 'Impossible de modifier une facture payée.');
        }
        
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'customer_id' => [
                'required',
                Rule::exists('customers', 'id')->where(function ($query) use ($request) {
                    $query->where('shop_id', $request->input('shop_id'));
                }),
            ],
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'status' => 'required|in:draft,sent,paid,cancelled',
            'payment_method' => 'nullable|in:cash,card,transfer,check,mobile',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        
        DB::transaction(function () use ($validated, $invoice) {
            $items = $validated['items'];
            unset($validated['items']);
            
            $invoice->update($validated);
            
            // Supprimer les anciens items et créer les nouveaux
            $invoice->items()->delete();
            
            foreach ($items as $item) {
                $invoice->items()->create($item);
            }
            
            // Le calcul des totaux se fait automatiquement via les observers
        });

        // Log activity
        ActivityLogger::updated($invoice, "Facture mise à jour: {$invoice->invoice_number}");

        return redirect()->route('invoices.index', ['code_user' => request()->route('code_user')])->with('success', 'Facture modifiée avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $code_user, Invoice $invoice)
    {
        // Ne pas permettre la suppression des factures payées
        if ($invoice->status === 'paid') {
            return redirect()->route('invoices.index', ['code_user' => request()->route('code_user')])
                ->with('error', 'Impossible de supprimer une facture payée.');
        }
        
        // Vérifier que la boutique de la facture appartient à l'utilisateur
        if ($invoice->shop->user_id !== Auth::id()) {
            abort(403);
        }

        // Sauvegarder le numéro avant suppression
        $invoiceNumber = $invoice->invoice_number;
        
        $invoice->delete();

        // Log activity
        ActivityLogger::deleted($invoice, "Facture supprimée: {$invoiceNumber}");

        return redirect()->route('invoices.index', ['code_user' => request()->route('code_user')])->with('success', 'Facture supprimée avec succès.');
    }
}
