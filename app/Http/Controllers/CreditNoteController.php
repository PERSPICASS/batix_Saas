<?php

namespace App\Http\Controllers;

use App\Models\CreditNote;
use App\Models\Invoice;
use App\Services\ActivityLogger;
use App\Support\ConcurrencySafe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * L'avoir : le seul chemin pour corriger une facture émise.
 *
 * Volontairement sans edit(), update() ni destroy(), à l'image de SaleController — un
 * avoir est lui-même une pièce comptable. Se tromper dans un avoir se corrige en émettant
 * une facture, jamais en réécrivant l'avoir.
 */
class CreditNoteController extends Controller
{
    public function index(Request $request): Response
    {
        $shopIds = Auth::user()->accessibleShopsQuery()->pluck('id');

        $query = CreditNote::whereIn('shop_id', $shopIds)
            ->with(['invoice:id,invoice_number', 'customer:id,name', 'shop:id,name'])
            ->latest('id');

        // Filtre exact, pour le bouton « Avoirs » de la liste des factures : passer par la
        // recherche textuelle sur le numéro attraperait aussi les avoirs d'une facture au
        // numéro voisin, INV-...0001 étant un préfixe de INV-...00010.
        if ($invoiceId = $request->input('invoice_id')) {
            $query->where('invoice_id', $invoiceId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('credit_note_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('invoice', fn ($i) => $i->where('invoice_number', 'like', "%{$search}%"));
            });
        }

        return Inertia::render('CreditNotes/Index', [
            'creditNotes' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only(['search', 'invoice_id']),
        ]);
    }

    public function create(string $code_user, Invoice $invoice): Response
    {
        $this->authorizeInvoice($invoice);

        abort_unless($invoice->isCreditable(), 403, "Cette facture n'est pas créditable.");

        $invoice->load('items', 'customer');

        return Inertia::render('CreditNotes/Create', [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->status,
                'total' => $invoice->total,
                'credited_total' => $invoice->creditedTotal(),
                'net_total' => $invoice->netTotal(),
                'customer' => $invoice->customer->only(['id', 'name']),
                // On n'expose que les lignes encore créditables, avec leur reste : le
                // formulaire ne peut donc pas proposer de créditer ce qui l'a déjà été.
                'items' => $invoice->items
                    ->filter(fn ($item) => $item->quantityCreditable() > 0)
                    ->map(fn ($item) => [
                        'id' => $item->id,
                        'product_name' => $item->product_name,
                        'quantity' => $item->quantity,
                        'quantity_credited' => $item->quantityCredited(),
                        'quantity_creditable' => $item->quantityCreditable(),
                        'unit_price' => $item->unit_price,
                        'tax_rate' => $item->tax_rate,
                    ])
                    ->values(),
            ],
        ]);
    }

    public function store(Request $request, string $code_user, Invoice $invoice)
    {
        $this->authorizeInvoice($invoice);

        if (!$invoice->isCreditable()) {
            return back()->with('error', "Cette facture n'est pas créditable.");
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.invoice_item_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        // Les lignes de la facture, indexées : c'est la facture qui fait foi sur le prix
        // et la quantité créditable, jamais ce que le client envoie.
        $invoiceItems = $invoice->items()->get()->keyBy('id');

        $lines = [];

        foreach ($validated['items'] as $index => $line) {
            $item = $invoiceItems->get($line['invoice_item_id']);

            // Une ligne d'une autre facture n'a rien à faire ici : ce serait créditer un
            // document qu'on n'a pas ouvert.
            if (!$item) {
                throw ValidationException::withMessages([
                    "items.{$index}.invoice_item_id" => "Cette ligne n'appartient pas à la facture.",
                ]);
            }

            $creditable = $item->quantityCreditable();

            if ($line['quantity'] > $creditable) {
                throw ValidationException::withMessages([
                    "items.{$index}.quantity" => $creditable === 0
                        ? 'Cette ligne est déjà intégralement créditée.'
                        : "Quantité créditable maximale : {$creditable}.",
                ]);
            }

            $lines[] = [
                'invoice_item_id' => $item->id,
                'product_name' => $item->product_name,
                'quantity' => $line['quantity'],
                'unit_price' => $item->unit_price,
                'tax_rate' => $item->tax_rate,
                'total' => round((float) $item->unit_price * $line['quantity'], 2),
            ];
        }

        // Le numéro se déduit du dernier connu : deux avoirs créés au même instant
        // calculeraient le même candidat. Même protection que sur les factures.
        $creditNote = ConcurrencySafe::retryOnDuplicate(fn () => DB::transaction(function () use ($invoice, $validated, $lines) {
            $creditNote = CreditNote::create([
                'shop_id' => $invoice->shop_id,
                'invoice_id' => $invoice->id,
                'customer_id' => $invoice->customer_id,
                'user_id' => Auth::id(),
                'credit_note_date' => now()->toDateString(),
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                $creditNote->items()->create($line);
            }

            $creditNote->calculateTotals();

            return $creditNote;
        }));

        ActivityLogger::created($creditNote, $creditNote->credit_note_number);

        return redirect()
            ->route('credit-notes.show', ['code_user' => $code_user, 'credit_note' => $creditNote->id])
            ->with('success', "Avoir {$creditNote->credit_note_number} émis.");
    }

    public function show(string $code_user, CreditNote $creditNote): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $creditNote->shop_id)->exists()) {
            abort(403);
        }

        $creditNote->load(['items', 'invoice', 'customer', 'shop', 'user:id,name']);

        return Inertia::render('CreditNotes/Show', [
            'creditNote' => $creditNote,
        ]);
    }

    private function authorizeInvoice(Invoice $invoice): void
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }
    }
}
