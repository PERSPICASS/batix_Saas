<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Services\ActivityLogger;
use App\Services\DocumentLink;
use App\Services\DocumentPdf;
use App\Support\ConcurrencySafe;
use Illuminate\Http\RedirectResponse;
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
        
        // withCount plutôt que with : la liste n'a besoin que de savoir si des avoirs
        // existent, pour n'afficher le bouton que là où il mène quelque part. Charger les
        // avoirs eux-mêmes ferait 20 requêtes de plus par page pour un simple compteur.
        $query = Invoice::with(['shop', 'customer', 'user'])
            ->withCount('creditNotes')
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
            ->whereNull('parent_id')
            ->with(['shop', 'category', 'variations' => fn($q) => $q->where('is_active', true)->orderBy('name')])
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
            'items.*.product_article_id' => 'nullable|exists:product_articles,id',
            'items.*.product_name' => 'required|string',
            'items.*.article_name' => 'nullable|string',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        
        // invoice_number est généré à partir du dernier numéro connu : deux factures créées
        // au même instant peuvent calculer le même candidat. Le retry régénère un numéro
        // frais à chaque tentative plutôt que de perdre la facture sur une violation de
        // contrainte brute.
        $invoice = ConcurrencySafe::retryOnDuplicate(fn () => DB::transaction(function () use ($validated, $shop) {
            $items = $validated['items'];
            unset($validated['items']);

            $validated['user_id'] = Auth::id();

            $invoice = $shop->invoices()->create($validated);
            
            foreach ($items as $item) {
                // Si un product_id est fourni et que c'est une déclinaison, enrichir le product_name
                if (!empty($item['product_id'])) {
                    $product = \App\Models\Product::find($item['product_id']);
                    if ($product && $product->parent_id && !str_contains($item['product_name'], ' › ')) {
                        $parent = $product->parent ?? \App\Models\Product::find($product->parent_id);
                        if ($parent) {
                            $item['product_name'] = "{$parent->name} › {$product->name}";
                        }
                    }
                }

                // Marquer l'article comme vendu
                if (!empty($item['product_article_id'])) {
                    \App\Models\ProductArticle::find($item['product_article_id'])?->markAsSold();
                }

                $invoice->items()->create($item);
            }
            
            // Le calcul des totaux se fait automatiquement via les observers

            return $invoice;
        }));

        // Log activity
        ActivityLogger::created($invoice, $invoice->invoice_number);

        return redirect()->route('invoices.index', ['code_user' => request()->route('code_user')])->with('success', 'Facture créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Invoice $invoice)
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }

        $invoice->load(['shop', 'customer', 'user', 'items.product.parent']);

        // Enrichir le product_name des anciens items de déclinaisons qui ne l'ont pas encore
        $invoice->items->each(function ($item) {
            if ($item->product && $item->product->parent_id && !str_contains($item->product_name, ' › ')) {
                $item->product_name = "{$item->product->parent->name} › {$item->product->name}";
            }
        });

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
            // La facture n'est jamais retouchée par un avoir : ce qu'elle vaut réellement
            // est un calcul, pas une colonne.
            'creditNotes' => $invoice->creditNotes()
                ->latest('id')
                ->get(['id', 'credit_note_number', 'credit_note_date', 'reason', 'total']),
            'creditedTotal' => $invoice->creditedTotal(),
            'netTotal' => $invoice->netTotal(),
            'isCreditable' => $invoice->isCreditable(),
            'shareUrl' => DocumentLink::forInvoice($invoice),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $code_user, Invoice $invoice): Response
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }

        if ($error = $this->refuseUnlessDraft($invoice)) {
            return $error;
        }

        $shops = Auth::user()->accessibleShops();
        $shopIds = $shops->pluck('id');
        
        $customers = Customer::whereIn('shop_id', $shopIds)
            ->with('shop')
            ->get();
        
        $products = Product::whereIn('shop_id', $shopIds)
            ->whereNull('parent_id')
            ->with(['shop', 'category', 'variations' => fn($q) => $q->where('is_active', true)->orderBy('name')])
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
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }

        if ($error = $this->refuseUnlessDraft($invoice)) {
            return $error;
        }

        $validated = $request->validate([
            'shop_id' => [
                'required',
                Rule::exists('shops', 'id')->whereIn('id', Auth::user()->accessibleShopsQuery()->pluck('id')),
            ],
            'customer_id' => [
                'required',
                Rule::exists('customers', 'id')->where(function ($query) use ($request) {
                    $query->where('shop_id', $request->input('shop_id'));
                }),
            ],
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            // On n'arrive ici que sur un brouillon, et un brouillon n'a que deux issues :
            // rester brouillon, ou être émis. Encaisser et annuler passent par
            // updateStatus() — sans cette restriction, ce formulaire contournerait la
            // table de transitions en posant `paid` directement.
            'status' => 'required|in:draft,sent',
            'payment_method' => 'nullable|in:cash,card,transfer,check,mobile',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_article_id' => 'nullable|exists:product_articles,id',
            'items.*.product_name' => 'required|string',
            'items.*.article_name' => 'nullable|string',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
        ]);

        // Instantané d'avant modification : les lignes sont détruites puis recréées
        // ci-dessous, donc sans cette copie leur contenu précédent ne subsiste nulle
        // part. Le journal recevait auparavant un tableau de changements VIDE : il
        // enregistrait qu'une facture avait été modifiée sans dire en quoi.
        $original = $invoice->getOriginal();
        $previousItems = $this->itemsSnapshot($invoice);

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

        // Recharger avant de comparer : les observers recalculent les totaux après coup,
        // donc getChanges() ne refléterait que leur dernière écriture.
        $invoice->refresh();

        // Même forme que LogsActivity : ['champ' => ['old' => …, 'new' => …]].
        $changes = [];
        foreach ($invoice->getAttributes() as $key => $value) {
            if (in_array($key, ['created_at', 'updated_at'], true)) {
                continue;
            }

            $old = $original[$key] ?? null;

            // Comparaison en chaînes : les décimaux castés ne se comparent pas de façon
            // fiable à ce qui sortait de la base.
            if ((string) $old !== (string) $value) {
                $changes[$key] = ['old' => $old, 'new' => $value];
            }
        }

        $newItems = $this->itemsSnapshot($invoice);
        if ($previousItems !== $newItems) {
            $changes['items'] = ['old' => $previousItems, 'new' => $newItems];
        }

        ActivityLogger::updated($invoice, $changes, $invoice->invoice_number);

        return redirect()->route('invoices.index', ['code_user' => request()->route('code_user')])->with('success', 'Facture modifiée avec succès.');
    }

    /**
     * Une facture n'est modifiable — et supprimable — que tant qu'elle est un brouillon.
     *
     * Passé `draft`, le document est parti chez le client : le réécrire rendrait
     * indéfendable ce que le client détient, et update() détruit les lignes pour les
     * recréer. Le statut, lui, doit continuer d'évoluer : c'est le rôle d'updateStatus(),
     * qui ne touche à rien d'autre.
     *
     * Renvoie une redirection à retourner tel quel, ou null si l'appel peut continuer.
     */
    private function refuseUnlessDraft(Invoice $invoice, string $route = 'invoices.show'): ?RedirectResponse
    {
        if ($invoice->status === 'draft') {
            return null;
        }

        $params = ['code_user' => request()->route('code_user')];

        if ($route === 'invoices.show') {
            $params['invoice'] = $invoice->id;
        }

        return redirect()->route($route, $params)
            ->with('error', 'Une facture émise ne peut plus être modifiée ni supprimée. Utilisez « Marquer payée » ou « Annuler ».');
    }

    /**
     * Faire évoluer le statut d'une facture émise, sans toucher à son contenu.
     *
     * Seul chemin restant pour encaisser ou annuler, l'écran d'édition étant fermé dès
     * l'émission. Les transitions sont explicitement énumérées : `paid` et `cancelled`
     * sont terminaux, et rien ne ramène une facture en arrière.
     *
     * L'annulation reste ici un simple statut. Tant qu'il n'existe pas d'avoir, c'est
     * l'approximation la moins mauvaise — mais c'est bien un avoir qu'il faudra émettre.
     */
    public function updateStatus(Request $request, string $code_user, Invoice $invoice)
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:paid,cancelled',
            'payment_method' => 'nullable|in:cash,card,transfer,check,mobile',
        ]);

        $allowed = [
            'draft' => ['cancelled'],
            'sent' => ['paid', 'cancelled'],
        ];

        $from = $invoice->status;
        $to = $validated['status'];

        if (!in_array($to, $allowed[$from] ?? [], true)) {
            return redirect()->route('invoices.show', ['code_user' => $code_user, 'invoice' => $invoice->id])
                ->with('error', 'Ce changement de statut n\'est pas autorisé.');
        }

        $attributes = ['status' => $to];

        if ($to === 'paid' && !empty($validated['payment_method'])) {
            $attributes['payment_method'] = $validated['payment_method'];
        }

        $invoice->update($attributes);

        ActivityLogger::updated(
            $invoice,
            ['status' => ['old' => $from, 'new' => $to]],
            $invoice->invoice_number
        );

        return redirect()->route('invoices.show', ['code_user' => $code_user, 'invoice' => $invoice->id])
            ->with('success', $to === 'paid' ? 'Facture marquée comme payée.' : 'Facture annulée.');
    }

    /**
     * Les lignes d'une facture, réduites à ce qui doit figurer au journal.
     *
     * @return array<int, array<string, mixed>>
     */
    private function itemsSnapshot(Invoice $invoice): array
    {
        return $invoice->items()
            ->orderBy('id')
            ->get()
            ->map(fn ($item) => [
                'product_name' => $item->product_name,
                'quantity' => $item->quantity,
                'unit_price' => (string) $item->unit_price,
                'total' => (string) $item->total,
            ])
            ->all();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $code_user, Invoice $invoice)
    {
        // Vérifier que la boutique de la facture appartient à l'utilisateur
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }

        // Une facture émise ne se supprime pas, elle s'annule : updateStatus().
        if ($error = $this->refuseUnlessDraft($invoice, 'invoices.index')) {
            return $error;
        }

        // Sauvegarder le numéro avant suppression
        $invoiceNumber = $invoice->invoice_number;
        
        $invoice->delete();

        // Log activity
        ActivityLogger::deleted($invoice, $invoiceNumber);

        return redirect()->route('invoices.index', ['code_user' => request()->route('code_user')])->with('success', 'Facture supprimée avec succès.');
    }

    public function pdf(string $code_user, Invoice $invoice, DocumentPdf $pdf)
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }

        return $pdf->forInvoice($invoice)->stream("Facture-{$invoice->invoice_number}.pdf");
    }

    public function send(string $code_user, Invoice $invoice)
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }

        // Le passage à `sent` n'a lieu qu'à la première émission. Renvoyer une facture
        // déjà payée est légitime — le client redemande son exemplaire — mais cela
        // faisait reculer son statut, contournant les transitions d'updateStatus() : une
        // facture payée redevenait « envoyée », donc réencaissable.
        if ($invoice->status === 'draft') {
            $invoice->update(['status' => 'sent']);
        }

        \Mail::to($invoice->customer->email)->send(new \App\Mail\InvoiceMail($invoice));

        return redirect()->back()->with('success', 'Facture envoyée au client');
    }

    public function export(string $code_user)
    {
        $activeShopId = get_active_shop_id();

        if (!$activeShopId || !Auth::user()->accessibleShopsQuery()->where('id', $activeShopId)->exists()) {
            return back()->with('error', 'Veuillez sélectionner une boutique.');
        }

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\InvoicesExport($activeShopId),
            'Factures-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function createRecurring(Request $request, string $code_user, Invoice $invoice)
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $invoice->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'frequency' => 'required|in:monthly,quarterly,semi-annual,annual',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $recurringInvoice = $invoice->toRecurringInvoice(
            $validated['frequency'],
            \Carbon\Carbon::parse($validated['start_date']),
            $validated['end_date'] ? \Carbon\Carbon::parse($validated['end_date']) : null
        );

        return redirect()->route('recurring-invoices.show', ['code_user' => $code_user, 'recurring_invoice' => $recurringInvoice])
            ->with('success', 'Cycle de facturation créé avec succès');
    }
}
