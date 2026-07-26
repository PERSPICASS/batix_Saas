<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopTransfer;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Services\ActivityLogger;
use App\Services\StockMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ShopController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $user = Auth::user();
        $shops = $user->accessibleShopsQuery()->latest()->get();

        return Inertia::render('Shops/Index', [
            'shops' => $shops,
            'canCreateShop' => $user->canCreateShop(),
            'remainingShops' => $user->remainingShopSlots(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Shops/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Vérifier la limite de boutiques
        if (!$user->canCreateShop()) {
            $limits = $user->getSubscriptionLimits();
            $max = $limits['max_shops'];
            return back()->with('error', "Vous avez atteint la limite de {$max} boutique(s) de votre offre. Passez à un plan supérieur pour en ajouter davantage.");
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'tax_id' => 'nullable|string|max:50',
        ]);

        // Additional shops inherit the user's country by default, like the
        // first one created during onboarding.
        $validated['country'] = $user->country ?: 'France';

        // Les réglages d'entreprise viennent du compte — devise, régime de taxe,
        // conventions de facturation — parce que le formulaire n'en demande aucun. Ce que
        // l'utilisateur a effectivement saisi l'emporte : on comble les vides, on
        // n'écrase rien. D'où le filtre, une chaîne vide n'étant pas une réponse.
        $submitted = array_filter(
            $validated,
            fn ($value) => $value !== null && $value !== ''
        );

        $validated = array_merge(Shop::inheritedSettingsFor($user), $submitted);

        $shop = $user->accessibleShopsQuery()->create($validated);

        // Log activity
        ActivityLogger::created($shop, $shop->name);

        return redirect()->route('shops.index', ['code_user' => request()->route('code_user')])->with('success', 'Boutique créée avec succès.');
    }

    /**
     * Copier des produits vers une autre boutique du compte.
     *
     * Un compte saisit son catalogue une fois. Ouvrir une succursale ne doit pas obliger à
     * tout ressaisir : le produit est recréé là-bas avec ses prix, sa TVA et sa catégorie,
     * à stock zéro.
     *
     * C'est une COPIE, pas un mouvement de marchandise : la boutique d'origine n'est pas
     * touchée et rien n'entre au registre des stocks. Chaque boutique approvisionne le sien.
     */
    public function transferProducts(Request $request, string $code_user, Shop $shop): RedirectResponse
    {
        $this->authorize('view', $shop);

        $user = Auth::user();

        $validated = $request->validate([
            'target_shop_id' => [
                'required',
                Rule::exists('shops', 'id')->where(fn ($q) => $q->whereIn('id', $user->accessibleShopsQuery()->pluck('id'))),
                // `different:` compare à un autre CHAMP du formulaire, pas à une valeur :
                // écrit ainsi il cherchait un champ nommé « 3 » et ne refusait rien.
                Rule::notIn([$shop->id]),
            ],
            // Tout copier d'un coup, ou une sélection. Le drapeau plutôt qu'une liste de
            // plusieurs centaines d'identifiants : c'est le cas d'usage même de l'ouverture
            // d'une boutique, et la requête n'a pas à transporter tout le catalogue.
            'all_products' => 'sometimes|boolean',
            'product_ids' => 'required_without:all_products|array|min:1',
            'product_ids.*' => [
                'required',
                Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'notes' => 'nullable|string',
        ]);

        $target = Shop::findOrFail($validated['target_shop_id']);

        [$transfer, $copied, $skipped] = DB::transaction(function () use ($validated, $shop, $target, $user) {
            $sources = Product::query()
                ->when(
                    $validated['all_products'] ?? false,
                    fn ($q) => $q->where('shop_id', $shop->id),
                    fn ($q) => $q->whereIn('id', array_unique($validated['product_ids'] ?? []))
                )
                // Les parents d'abord : une déclinaison rencontrée seule ferait copier son
                // parent au passage, ce qui marche mais brouille l'ordre du document.
                ->orderByRaw('parent_id is not null')
                ->orderBy('id')
                ->get();

            $transfer = ShopTransfer::create([
                'from_shop_id' => $shop->id,
                'to_shop_id' => $target->id,
                'user_id' => $user->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            $copied = 0;
            $skipped = 0;

            foreach ($sources as $source) {
                [$destination, $created] = $this->copyInto($target, $source);

                // Déjà présent là-bas : on ne recrée pas, et surtout on ne touche à rien —
                // la boutique de destination a pu ajuster son prix depuis.
                if (!$created) {
                    $skipped++;
                    continue;
                }

                $copied++;

                $transfer->items()->create([
                    'product_id' => $source->id,
                    'target_product_id' => $destination->id,
                    'product_name' => $source->name,
                ]);
            }

            return [$transfer, $copied, $skipped];
        });

        if ($copied === 0) {
            return back()->with('info', "Rien à copier : ces produits existent déjà chez « {$target->name} ».");
        }

        $message = "Copie {$transfer->reference} : {$copied} produit(s) ajouté(s) à « {$target->name} »";
        $message .= $skipped > 0 ? ", {$skipped} déjà présent(s)." : '.';

        return back()->with('success', $message);
    }

    /**
     * Les transferts d'une boutique, envoyés comme reçus.
     */
    public function transfers(string $code_user, Shop $shop): Response
    {
        $this->authorize('view', $shop);

        $transfers = ShopTransfer::with(['fromShop:id,name', 'toShop:id,name', 'user:id,name', 'items'])
            ->where(fn ($q) => $q->where('from_shop_id', $shop->id)->orWhere('to_shop_id', $shop->id))
            ->latest('id')
            ->paginate(20);

        return Inertia::render('Shops/Transfers', [
            'shop' => $shop->only(['id', 'name']),
            'transfers' => $transfers,
        ]);
    }

    /**
     * L'équivalent de la catégorie du produit dans la boutique de destination.
     *
     * Rapproché par nom : les catégories sont propres à chaque boutique, donc l'identifiant
     * de la source n'y a aucun sens. Null si elle n'existe pas là-bas — mieux vaut un
     * produit sans catégorie qu'un produit rangé chez le voisin.
     */
    private function matchingCategoryIn(Shop $target, Product $source): ?int
    {
        if (!$source->category) {
            return null;
        }

        return Category::where('shop_id', $target->id)
            ->where('name', $source->category->name)
            ->value('id');
    }

    /**
     * Le produit déjà présent dans la boutique de destination, s'il y est.
     *
     * Le SKU d'abord, puis le couple NOM + MARQUE — pas le nom seul. Le nom seul faisait
     * passer pour des doublons tous les produits homonymes : sur un catalogue de 3048
     * références n'ayant que 1031 noms distincts, la copie n'en créait que 1031.
     * Nom + marque est aussi ce sur quoi les imports rapprochent leurs lignes.
     *
     * Le niveau compte également : une déclinaison « Rouge 5L » n'est pas la même sous deux
     * peintures différentes, d'où la comparaison du parent côté destination.
     */
    private function existingProductIn(Shop $target, Product $source, ?int $targetParentId): ?Product
    {
        if ($source->sku) {
            $bySku = Product::where('shop_id', $target->id)->where('sku', $source->sku)->first();

            if ($bySku) {
                return $bySku;
            }
        }

        return Product::where('shop_id', $target->id)
            ->where('name', $source->name)
            // `where('brand', null)` ne rapproche jamais rien en SQL : il faut whereNull.
            ->when($source->brand === null, fn ($q) => $q->whereNull('brand'))
            ->when($source->brand !== null, fn ($q) => $q->where('brand', $source->brand))
            ->when($targetParentId === null, fn ($q) => $q->whereNull('parent_id'))
            ->when($targetParentId !== null, fn ($q) => $q->where('parent_id', $targetParentId))
            ->first();
    }

    /**
     * Le produit correspondant dans la boutique de destination, créé au besoin.
     *
     * Le parent est résolu AVANT de chercher l'existant : c'est lui qui situe une
     * déclinaison, et une déclinaison ne peut de toute façon pas être créée sans lui.
     *
     * @return array{0: Product, 1: bool} Le produit, et s'il vient d'être créé.
     */
    private function copyInto(Shop $target, Product $source): array
    {
        $targetParentId = null;

        if ($source->parent_id && $source->parent) {
            [$parent] = $this->copyInto($target, $source->parent);
            $targetParentId = $parent->id;
        }

        if ($existing = $this->existingProductIn($target, $source, $targetParentId)) {
            return [$existing, false];
        }

        return [Product::create([
            'shop_id' => $target->id,
            'parent_id' => $targetParentId,
            'has_variations' => $source->has_variations,
            // La catégorie est rattachée à une boutique : recopier l'identifiant de la
            // source ferait pointer le produit vers la catégorie d'une AUTRE boutique.
            'category_id' => $this->matchingCategoryIn($target, $source),
            'name' => $source->name,
            'sku' => $source->sku,
            'description' => $source->description,
            'brand' => $source->brand,
            'unit' => $source->unit,
            'purchase_price' => $source->purchase_price,
            'average_cost' => $source->average_cost,
            'selling_price' => $source->selling_price,
            'tax_rate' => $source->tax_rate,
            'min_stock_alert' => $source->min_stock_alert,
            'stock_quantity' => 0,
            'track_stock' => true,
            'is_active' => true,
        ]), true];
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Shop $shop)
    {
        $this->authorize('view', $shop);

        $user = Auth::user();

        // La page rendait `Shops/Show`, un composant qui n'existait pas : Inertia ne
        // pouvait pas le résoudre, d'où un écran blanc au clic sur « Voir ».
        // Les statistiques ne comptent que les produits parents, mais le transfert doit
        // pouvoir porter sur une déclinaison : c'est elle qui détient le stock.
        $products = $shop->products()->whereNull('parent_id')->get();
        $transferable = $shop->products()->with('parent:id,name')->get();

        return Inertia::render('Shops/Show', [
            'shop' => $shop,
            'stats' => [
                'products' => $products->count(),
                'stock_units' => (int) $products->sum('stock_quantity'),
                'stock_value' => round($products->sum(fn ($product) => $product->stockValue()), 2),
                'low_stock' => $products->filter(fn ($product) => $product->isLowStock())->count(),
            ],
            // Les autres boutiques du compte, destinations possibles d'un transfert.
            'otherShops' => $user->accessibleShopsQuery()
                ->where('id', '!=', $shop->id)
                ->get(['id', 'name']),
            // Tous les produits, y compris ceux à stock zéro : une succursale qui ouvre a
            // justement besoin du catalogue avant d'avoir la marchandise.
            'transferableProducts' => $transferable
                ->map(fn ($product) => [
                    'id' => $product->id,
                    // Une déclinaison seule est ambiguë : « Rouge » ne dit pas de quoi.
                    'name' => $product->parent
                        ? "{$product->parent->name} › {$product->name}"
                        : $product->name,
                    'sku' => $product->sku,
                    'stock_quantity' => $product->stock_quantity,
                ])
                ->values(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $code_user, Shop $shop): Response
    {
        $this->authorize('update', $shop);
        
        return Inertia::render('Shops/Edit', [
            'shop' => $shop,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $code_user, Shop $shop)
    {
        $this->authorize('update', $shop);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'tax_id' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $shop->update($validated);

        // Log activity
        ActivityLogger::updated($shop, [], $shop->name);

        return redirect()->route('shops.index', ['code_user' => request()->route('code_user')])->with('success', 'Boutique mise à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $code_user, Shop $shop)
    {
        $this->authorize('delete', $shop);
        
        // Sauvegarder le nom avant suppression
        $shopName = $shop->name;
        
        $shop->delete();

        // Log activity
        ActivityLogger::deleted($shop, $shopName);

        return redirect()->route('shops.index', ['code_user' => request()->route('code_user')])->with('success', 'Boutique supprimée avec succès.');
    }

    /**
     * Afficher le formulaire de création de la première boutique (Étape 3 de l'inscription)
     */
    public function createInitial(): Response
    {
        $user = Auth::user();

        // Vérifier que l'utilisateur n'a pas déjà de boutique
        if ($user->shops()->exists()) {
            return redirect()->route('dashboard', ['code_user' => $user->code_user]);
        }

        // Vérifier que l'email est vérifié
        if (!$user->hasVerifiedEmail()) {
            return redirect()->route('verification.code.show');
        }

        return Inertia::render('Auth/CreateShop');
    }

    /**
     * Créer la première boutique après inscription (Étape 3 de l'inscription)
     */
    public function storeInitial(Request $request)
    {
        $user = Auth::user();

        // Vérifier que l'utilisateur n'a pas déjà de boutique
        if ($user->shops()->exists()) {
            $redirectUrl = route('dashboard', ['code_user' => $user->code_user]);
            return $request->wantsJson()
                ? response()->json(['redirect' => $redirectUrl])
                : redirect($redirectUrl);
        }

        // Vérifier que l'email est vérifié
        if (!$user->hasVerifiedEmail()) {
            $redirectUrl = route('verification.code.show');
            return $request->wantsJson()
                ? response()->json(['redirect' => $redirectUrl], 403)
                : redirect($redirectUrl);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
        ]);

        // Vérifier que le nom (slug) n'est pas déjà pris
        $slug = \Illuminate\Support\Str::slug($validated['name']);
        if (\App\Models\Shop::where('slug', $slug)->exists()) {
            return response()->json([
                'message' => 'Ce nom de boutique est déjà utilisé. Veuillez en choisir un autre.',
                'errors' => ['name' => ['Ce nom de boutique est déjà utilisé. Veuillez en choisir un autre.']],
            ], 422);
        }

        // Créer la première boutique de l'utilisateur
        $shop = $user->shops()->create([
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'phone' => $validated['phone'] ?? null,
            // Première boutique du compte : rien à hériter, la méthode retombe sur son
            // dernier recours. Elle reste réglable dans les Réglages.
            'currency' => Shop::defaultCurrencyFor($user),
            // Default to the country the user picked at registration, not a
            // hardcoded one.
            'country' => $user->country ?: 'France',
        ]);

        // Associer l'utilisateur à la boutique créée
        $user->update(['shop_id' => $shop->id]);

        // Donner toutes les permissions sur tous les modules au super_admin
        $modules = ['shops', 'products', 'categories', 'stocks', 'inventory', 'sales', 'suppliers', 'customers', 'invoices', 'users', 'reports'];
        foreach ($modules as $module) {
            $user->permissions()->create([
                'module' => $module,
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ]);
        }

        // ✨ Attribuer automatiquement le plan FREE (14 jours)
        $freePlan = SubscriptionPlan::where('slug', 'free')->first();
        
        if ($freePlan) {
            Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $freePlan->id,
                'status' => 'trial',
                'amount' => 0, // Plan gratuit
                'started_at' => now(),
                'expires_at' => now()->addDays(14),
                'trial_ends_at' => now()->addDays(14), // 14 jours d'essai gratuit
            ]);
        }

        // Définir la boutique active en session
        session(['active_shop_id' => $shop->id]);

        // Log activity
        ActivityLogger::message('create', 'shop_first_created', ['name' => $shop->name], $shop);

        $redirectUrl = route('dashboard', ['code_user' => $user->code_user]);

        // Retourner JSON si axios, redirect sinon
        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Bienvenue ! Votre boutique a été créée avec succès.',
                'redirect' => $redirectUrl,
            ]);
        }

        // Rediriger vers le dashboard avec message de bienvenue
        return redirect($redirectUrl)
            ->with('success', 'Bienvenue ! Votre boutique a été créée avec succès. Vous disposez de 14 jours d\'essai gratuit.');
    }
}
