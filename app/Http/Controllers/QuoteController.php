<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Invoice;
use App\Models\Shop;
use App\Traits\ResolvesTaxRate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class QuoteController extends Controller
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

        $query = Quote::with('customer')
            ->where('shop_id', $shop->id);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('quote_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $quotes = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Quotes/Index', [
            'quotes' => $quotes,
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

        return Inertia::render('Quotes/Create', [
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
            'quote_date' => 'required|date',
            'expiry_date' => 'required|date|after:quote_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                \Illuminate\Validation\Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'items.*.product_article_id' => 'nullable|exists:product_articles,id',
            'items.*.article_name' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        // Totaux, taux de ligne et numérotation vivent dans le service, partagé avec
        // l'API v1 : un devis créé par l'assistant IA doit être chiffré exactement
        // comme celui saisi ici.
        $quote = \App\Services\QuoteWriter::create($validated, $shop);

        return redirect()->route('quotes.show', ['code_user' => $code_user, 'quote' => $quote])->with('success', 'Devis créé avec succès');
    }

    public function show(string $code_user, Quote $quote): Response
    {
        // Vérifier que le devis appartient à la boutique de l'utilisateur
        if (!Auth::user()->accessibleShopsQuery()->where('id', $quote->shop_id)->exists()) {
            abort(403);
        }

        return Inertia::render('Quotes/Show', [
            'quote' => $quote->load('customer', 'items.product'),
            'shareUrl' => \App\Services\DocumentLink::forQuote($quote),
        ]);
    }

    public function edit(string $code_user, Quote $quote): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $quote->shop_id)->exists()) {
            abort(403);
        }

        $customers = Customer::where('shop_id', $quote->shop_id)
            ->get(['id', 'name']);

        $products = Product::where('shop_id', $quote->shop_id)
            ->get(['id', 'name', 'selling_price', 'tax_rate']);

        $quote->load('customer', 'items.product');

        // Format quote data with dates in YYYY-MM-DD format
        $quoteData = $quote->toArray();
        $quoteData['quote_date'] = $quote->quote_date->format('Y-m-d');
        $quoteData['expiry_date'] = $quote->expiry_date->format('Y-m-d');
        // Ensure customer is included
        $quoteData['customer'] = $quote->customer->toArray();
        // Ensure items with products are included
        $quoteData['items'] = $quote->items->map(fn($item) => array_merge($item->toArray(), [
            'product' => $item->product->toArray(),
        ]))->toArray();

        return Inertia::render('Quotes/Edit', [
            'quote' => $quoteData,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function update(Request $request, string $code_user, Quote $quote): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $quote->shop_id)->exists()) {
            abort(403);
        }

        if ($quote->status !== 'draft') {
            return redirect()->back()->with('error', 'Seuls les devis en brouillon peuvent être modifiés');
        }

        $validated = $request->validate([
            'quote_date' => 'required|date',
            'expiry_date' => 'required|date|after:quote_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                \Illuminate\Validation\Rule::exists('products', 'id')->where('shop_id', $quote->shop_id),
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        // Même service que l'API v1 : un devis modifié par l'assistant IA doit être
        // rechiffré exactement comme celui édité ici.
        \App\Services\QuoteWriter::update($quote, $validated);

        return redirect()->route('quotes.show', ['code_user' => $code_user, 'quote' => $quote])->with('success', 'Devis mis à jour');
    }


    public function pdf(string $code_user, Quote $quote, \App\Services\DocumentPdf $pdf)
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $quote->shop_id)->exists()) {
            abort(403);
        }

        return $pdf->forQuote($quote)->stream("Devis-{$quote->quote_number}.pdf");
    }

    public function send(string $code_user, Quote $quote): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $quote->shop_id)->exists()) {
            abort(403);
        }

        $quote->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        \Mail::to($quote->customer->email)->send(new \App\Mail\QuoteMail($quote));

        return redirect()->back()->with('success', 'Devis envoyé au client');
    }

    public function accept(string $code_user, Quote $quote): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $quote->shop_id)->exists()) {
            abort(403);
        }

        $quote->accept();

        return redirect()->back()->with('success', 'Devis accepté');
    }

    public function export(string $code_user)
    {
        $shop = $this->resolveActiveShop();
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\QuotesExport($shop->id),
            'Devis-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function convertToInvoice(string $code_user, Quote $quote): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $quote->shop_id)->exists()) {
            abort(403);
        }

        if ($quote->status !== 'accepted') {
            return redirect()->back()->with('error', 'Seuls les devis acceptés peuvent être convertis en facture');
        }

        // Load relationships needed for invoice item creation
        $quote->load('items.product');
        $invoice = $quote->convertToInvoice();

        return redirect()->route('invoices.show', ['code_user' => $code_user, 'invoice' => $invoice])->with('success', 'Facture créée depuis le devis');
    }

    public function destroy(string $code_user, Quote $quote): RedirectResponse
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $quote->shop_id)->exists()) {
            abort(403);
        }

        $quote->delete();

        return redirect()->route('quotes.index', ['code_user' => $code_user])->with('success', 'Devis supprimé');
    }
}
