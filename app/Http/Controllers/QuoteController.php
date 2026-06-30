<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class QuoteController extends Controller
{
    public function index(string $code_user): Response
    {
        $shop = auth()->user()->shops->first();

        $quotes = Quote::with('customer')
            ->where('shop_id', $shop->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Quotes/Index', [
            'quotes' => $quotes,
        ]);
    }

    public function create(string $code_user): Response
    {
        $shop = auth()->user()->shops->first();

        $customers = Customer::where('shop_id', $shop->id)
            ->get(['id', 'name', 'email']);

        $products = Product::where('shop_id', $shop->id)
            ->get(['id', 'name', 'selling_price']);

        return Inertia::render('Quotes/Create', [
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function store(Request $request, string $code_user): RedirectResponse
    {
        $shop = auth()->user()->shops->first();

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'quote_date' => 'required|date',
            'expiry_date' => 'required|date|after:quote_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        $subtotal = collect($validated['items'])->sum(function ($item) {
            return $item['quantity'] * $item['unit_price'];
        });

        $taxAmount = $subtotal * 0.18; // 18% TVA
        $total = $subtotal + $taxAmount;

        $quote = Quote::create([
            'shop_id' => $shop->id,
            'customer_id' => $validated['customer_id'],
            'quote_number' => Quote::generateNumber($shop->id),
            'quote_date' => $validated['quote_date'],
            'expiry_date' => $validated['expiry_date'],
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'notes' => $validated['notes'] ?? null,
            'terms' => $validated['terms'] ?? null,
            'status' => 'draft',
        ]);

        foreach ($validated['items'] as $item) {
            $quote->items()->create([
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'line_total' => $item['quantity'] * $item['unit_price'],
                'tax_rate' => 18,
            ]);
        }

        return redirect()->route('quotes.show', $quote)->with('success', 'Devis créé avec succès');
    }

    public function show(string $code_user, Quote $quote): Response
    {
        // Vérifier que le devis appartient à la boutique de l'utilisateur
        $shop = auth()->user()->shops->first();
        if ($quote->shop_id !== $shop->id) {
            abort(403);
        }

        return Inertia::render('Quotes/Show', [
            'quote' => $quote->load('customer', 'items.product'),
        ]);
    }

    public function edit(string $code_user, Quote $quote): Response
    {
        $shop = auth()->user()->shops->first();
        if ($quote->shop_id !== $shop->id) {
            abort(403);
        }

        $customers = Customer::where('shop_id', $shop->id)
            ->get(['id', 'name']);

        $products = Product::where('shop_id', $shop->id)
            ->get(['id', 'name', 'selling_price']);

        return Inertia::render('Quotes/Edit', [
            'quote' => $quote->load('items.product'),
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function update(Request $request, string $code_user, Quote $quote): RedirectResponse
    {
        $shop = auth()->user()->shops->first();
        if ($quote->shop_id !== $shop->id) {
            abort(403);
        }

        if ($quote->status !== 'draft') {
            return redirect()->back()->with('error', 'Seuls les devis en brouillon peuvent être modifiés');
        }

        $validated = $request->validate([
            'quote_date' => 'required|date',
            'expiry_date' => 'required|date|after:quote_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        $subtotal = collect($validated['items'])->sum(function ($item) {
            return $item['quantity'] * $item['unit_price'];
        });

        $taxAmount = $subtotal * 0.18;
        $total = $subtotal + $taxAmount;

        $quote->update([
            'quote_date' => $validated['quote_date'],
            'expiry_date' => $validated['expiry_date'],
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'notes' => $validated['notes'],
            'terms' => $validated['terms'],
        ]);

        $quote->items()->delete();
        foreach ($validated['items'] as $item) {
            $quote->items()->create([
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'line_total' => $item['quantity'] * $item['unit_price'],
                'tax_rate' => 18,
            ]);
        }

        return redirect()->route('quotes.show', $quote)->with('success', 'Devis mis à jour');
    }

    public function send(string $code_user, Quote $quote): RedirectResponse
    {
        $shop = auth()->user()->shops->first();
        if ($quote->shop_id !== $shop->id) {
            abort(403);
        }

        $quote->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        // TODO: Envoyer email au client

        return redirect()->back()->with('success', 'Devis envoyé au client');
    }

    public function accept(string $code_user, Quote $quote): RedirectResponse
    {
        $shop = auth()->user()->shops->first();
        if ($quote->shop_id !== $shop->id) {
            abort(403);
        }

        $quote->accept();

        return redirect()->back()->with('success', 'Devis accepté');
    }

    public function convertToInvoice(string $code_user, Quote $quote): RedirectResponse
    {
        $shop = auth()->user()->shops->first();
        if ($quote->shop_id !== $shop->id) {
            abort(403);
        }

        if ($quote->status !== 'accepted') {
            return redirect()->back()->with('error', 'Seuls les devis acceptés peuvent être convertis en facture');
        }

        $invoice = $quote->convertToInvoice();

        return redirect()->route('invoices.show', $invoice)->with('success', 'Facture créée depuis le devis');
    }

    public function destroy(string $code_user, Quote $quote): RedirectResponse
    {
        $shop = auth()->user()->shops->first();
        if ($quote->shop_id !== $shop->id) {
            abort(403);
        }

        $quote->delete();

        return redirect()->route('quotes.index')->with('success', 'Devis supprimé');
    }
}
