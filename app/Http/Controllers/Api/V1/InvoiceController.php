<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Api\V1\Concerns\SearchesText;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreInvoiceApiRequest;
use App\Http\Requests\Api\V1\UpdateInvoiceApiRequest;
use App\Http\Resources\Api\V1\InvoiceResource;
use App\Models\Invoice;
use App\Models\Product;
use App\Services\ActivityLogger;
use App\Services\DocumentLink;
use App\Support\ConcurrencySafe;
use App\Traits\ResolvesTaxRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    use ResolvesTaxRate;
    use ScopesToAccessibleShops;
    use SearchesText;

    public function index(Request $request): AnonymousResourceCollection
    {
        $invoices = Invoice::whereIn('shop_id', $this->resolveShopIds($request))
            ->with(['customer', 'shop.user:id,code_user'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');

                $q->where(function ($q) use ($term) {
                    $this->applyTextSearch($q, ['invoice_number'], $term);
                    $q->orWhereHas('customer', fn ($c) => $this->applyTextSearch($c, ['name'], $term));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('since'), fn ($q) => $q->where('updated_at', '>', $request->query('since')))
            ->orderByDesc('invoice_date')
            ->paginate($this->resolvePerPage($request));

        return InvoiceResource::collection($invoices);
    }

    public function show(Request $request, Invoice $invoice): InvoiceResource
    {
        abort_unless(in_array($invoice->shop_id, $this->resolveShopIds($request), true), 404);

        return new InvoiceResource($invoice->load(['customer', 'items', 'shop.user:id,code_user']));
    }

    /** Génère à la demande un lien signé court, sans exposer le token Sanctum. */
    public function downloadLink(Request $request, Invoice $invoice): JsonResponse
    {
        abort_unless(in_array($invoice->shop_id, $this->resolveShopIds($request), true), 404);

        $expiresAt = now()->addMinutes(DocumentLink::DOWNLOAD_LIFETIME_MINUTES);

        return response()->json([
            'data' => [
                'download_url' => DocumentLink::temporaryForInvoice($invoice, $expiresAt),
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ]);
    }

    /**
     * Crée une facture en BROUILLON. Le statut n'est pas négociable par l'appelant :
     * une facture émise déstocke la marchandise et devient une pièce comptable dont le
     * numéro n'est jamais réattribué. L'API prépare, l'humain émet depuis l'application.
     */
    public function store(StoreInvoiceApiRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Aborts with 403 if shop_id isn't one of the token's accessible shops.
        $this->resolveShopIds($request);

        $shop = $request->user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);

        // invoice_number est généré à partir du dernier numéro connu : deux factures
        // créées au même instant peuvent calculer le même candidat. Le retry en
        // régénère un frais plutôt que de perdre la facture sur une violation de
        // contrainte brute.
        $invoice = ConcurrencySafe::retryOnDuplicate(fn () => DB::transaction(function () use ($validated, $shop, $request) {
            $items = $validated['items'];
            unset($validated['items']);

            $validated['user_id'] = $request->user()->id;
            $validated['status'] = 'draft';

            $invoice = $shop->invoices()->create($validated);

            $this->syncItems($invoice, $items, $shop);

            // Les totaux sont recalculés par les hooks de InvoiceItem.
            return $invoice;
        }));

        // Aucun appel à releaseStock() : un brouillon ne sort pas la marchandise.
        ActivityLogger::created($invoice, $invoice->invoice_number);

        return (new InvoiceResource($invoice->refresh()->load(['customer', 'items', 'shop.user:id,code_user'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Modifie une facture, à condition qu'elle soit encore en BROUILLON.
     *
     * C'est la limite que pose déjà l'application à son propre formulaire : une facture
     * émise est une pièce comptable. La corriger après coup passe par une annulation ou
     * un avoir, jamais par une réécriture silencieuse.
     */
    public function update(UpdateInvoiceApiRequest $request, Invoice $invoice): JsonResponse
    {
        abort_unless(in_array($invoice->shop_id, $this->resolveShopIds($request), true), 404);

        if ($invoice->status !== 'draft') {
            return response()->json([
                'message' => "Cette facture n'est plus un brouillon (statut : {$invoice->status}) : elle ne peut plus être modifiée. "
                    . 'Une facture émise se corrige par une annulation ou un avoir, depuis l\'application.',
            ], 409);
        }

        $validated = $request->validated();
        $shop = $invoice->shop;

        DB::transaction(function () use ($invoice, $validated, $shop) {
            $items = $validated['items'];
            unset($validated['items']);

            $invoice->update($validated);

            // Les lignes sont remplacées, pas fusionnées : c'est ce qui permet d'en
            // retirer une. Les hooks de InvoiceItem recalculent les totaux à chaque
            // suppression puis à chaque création.
            $invoice->items()->delete();
            $this->syncItems($invoice, $items, $shop);
        });

        $invoice->refresh();
        ActivityLogger::updated($invoice, $invoice->getChanges(), $invoice->invoice_number);

        return (new InvoiceResource($invoice->load(['customer', 'items', 'shop.user:id,code_user'])))
            ->response();
    }

    /**
     * Crée les lignes d'une facture, en complétant ce que l'appelant n'a pas fourni.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function syncItems(Invoice $invoice, array $items, $shop): void
    {
        foreach ($items as $item) {
            // Un taux absent n'est pas un taux nul : sans cela, InvoiceItem
            // normaliserait le null en 0 et la facture d'une boutique assujettie
            // sortirait hors taxe. On retombe sur le taux du produit, puis sur
            // celui de la boutique — même ordre qu'au comptoir et sur les devis.
            $item['tax_rate'] = $item['tax_rate']
                ?? $this->taxRateFor($item['product_id'] ?? null, $shop);

            // Sur une déclinaison, afficher le produit parent devant le variant,
            // comme le fait le formulaire web.
            if (! empty($item['product_id']) && ! str_contains($item['product_name'], ' › ')) {
                $product = Product::find($item['product_id']);
                $parent = $product?->parent_id ? ($product->parent ?? Product::find($product->parent_id)) : null;
                if ($parent) {
                    $item['product_name'] = "{$parent->name} › {$product->name}";
                }
            }

            $invoice->items()->create($item);
        }
    }
}
