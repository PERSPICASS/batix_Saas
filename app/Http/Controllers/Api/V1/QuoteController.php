<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ScopesToAccessibleShops;
use App\Http\Controllers\Api\V1\Concerns\SearchesText;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreQuoteApiRequest;
use App\Http\Requests\Api\V1\UpdateQuoteApiRequest;
use App\Http\Resources\Api\V1\QuoteResource;
use App\Models\Quote;
use App\Services\ActivityLogger;
use App\Services\QuoteWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class QuoteController extends Controller
{
    use ScopesToAccessibleShops;
    use SearchesText;

    public function index(Request $request): AnonymousResourceCollection
    {
        $quotes = Quote::whereIn('shop_id', $this->resolveShopIds($request))
            ->with(['customer', 'shop.user:id,code_user'])
            // Retrouver un devis par son NUMÉRO est indispensable : c'est la seule
            // référence qu'un utilisateur — ou l'assistant, d'un tour de conversation à
            // l'autre — a sous la main. Sans cela le modèle devine un identifiant.
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = $request->query('search');

                $q->where(function ($q) use ($term) {
                    $this->applyTextSearch($q, ['quote_number'], $term);
                    $q->orWhereHas('customer', fn ($c) => $this->applyTextSearch($c, ['name'], $term));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('since'), fn ($q) => $q->where('updated_at', '>', $request->query('since')))
            ->orderByDesc('quote_date')
            ->paginate($this->resolvePerPage($request));

        return QuoteResource::collection($quotes);
    }

    public function show(Request $request, Quote $quote): QuoteResource
    {
        abort_unless(in_array($quote->shop_id, $this->resolveShopIds($request), true), 404);

        return new QuoteResource($quote->load(['customer', 'items', 'shop.user:id,code_user']));
    }

    public function store(StoreQuoteApiRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Aborts with 403 if shop_id isn't one of the token's accessible shops.
        $this->resolveShopIds($request);

        $shop = $request->user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        $validated['user_id'] = $request->user()->id;

        $quote = QuoteWriter::create($validated, $shop);

        ActivityLogger::created($quote, $quote->quote_number);

        return (new QuoteResource($quote->load(['customer', 'items', 'shop.user:id,code_user'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Modifie un devis, à condition qu'il soit encore en BROUILLON.
     *
     * Un devis envoyé ou accepté engage le commerçant vis-à-vis de son client : le
     * rechiffrer en douce ferait diverger le document du client et celui de la boutique.
     * L'application applique déjà cette règle à son formulaire d'édition ; l'API et
     * l'assistant s'y tiennent aussi.
     */
    public function update(UpdateQuoteApiRequest $request, Quote $quote): JsonResponse
    {
        abort_unless(in_array($quote->shop_id, $this->resolveShopIds($request), true), 404);

        if ($quote->status !== 'draft') {
            return response()->json([
                'message' => "Ce devis n'est plus un brouillon (statut : {$quote->status}) : il ne peut plus être modifié. "
                    . 'Créez-en un nouveau si les conditions ont changé.',
            ], 409);
        }

        $quote = QuoteWriter::update($quote, $request->validated());

        ActivityLogger::updated($quote, $quote->getChanges(), $quote->quote_number);

        return (new QuoteResource($quote->load(['customer', 'items', 'shop.user:id,code_user'])))
            ->response();
    }
}
