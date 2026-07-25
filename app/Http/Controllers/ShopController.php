<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Shop;
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
     * Transférer des produits vers une autre boutique du compte.
     *
     * Un produit appartient à une seule boutique : il n'y a donc rien à « déplacer ». On
     * sort la quantité du produit source, et on la fait entrer sur son homologue chez la
     * destination — retrouvé par SKU puis par nom, comme le fait déjà l'entrée en dépôt, et
     * créé s'il n'existe pas encore là-bas.
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
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id')->where('shop_id', $shop->id),
            ],
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $target = Shop::findOrFail($validated['target_shop_id']);

        DB::transaction(function () use ($validated, $shop, $target) {
            $wanted = [];
            foreach ($validated['items'] as $item) {
                $wanted[$item['product_id']] = ($wanted[$item['product_id']] ?? 0) + (int) $item['quantity'];
            }

            // Verrouiller avant de vérifier : deux transferts simultanés de la dernière
            // pièce passeraient sinon tous deux le contrôle.
            $sources = Product::whereIn('id', array_keys($wanted))->lockForUpdate()->get()->keyBy('id');

            $errors = [];
            foreach ($wanted as $productId => $quantity) {
                $source = $sources->get($productId);

                if ($source && $source->track_stock && $source->stock_quantity < $quantity) {
                    $errors['items'][] = "Stock insuffisant pour « {$source->name} » (disponible : {$source->stock_quantity}, demandé : {$quantity}).";
                }
            }

            if (!empty($errors)) {
                throw ValidationException::withMessages($errors);
            }

            foreach ($wanted as $productId => $quantity) {
                $source = $sources->get($productId);

                if (!$source) {
                    continue;
                }

                $destination = $this->matchingProductIn($target, $source);

                StockMovementService::recordShopTransfer(
                    $source,
                    -$quantity,
                    $target,
                    "Transfert vers « {$target->name} »"
                );

                StockMovementService::recordShopTransfer(
                    $destination,
                    $quantity,
                    $shop,
                    "Transfert depuis « {$shop->name} »"
                );
            }
        });

        $count = count($validated['items']);

        return back()->with('success', $count === 1
            ? "Produit transféré vers « {$target->name} »."
            : "{$count} produits transférés vers « {$target->name} ».");
    }

    /**
     * L'homologue d'un produit dans la boutique de destination.
     *
     * Rapproché par SKU puis par nom — le SKU d'abord, un nom pouvant être retouché. Créé
     * à stock zéro s'il n'existe pas encore : la quantité arrivera par le mouvement de
     * transfert, pour que l'entrée figure au registre comme n'importe quelle autre.
     */
    private function matchingProductIn(Shop $target, Product $source): Product
    {
        $existing = null;

        if ($source->sku) {
            $existing = Product::where('shop_id', $target->id)->where('sku', $source->sku)->first();
        }

        $existing ??= Product::where('shop_id', $target->id)->where('name', $source->name)->first();

        if ($existing) {
            return $existing;
        }

        return Product::create([
            'shop_id' => $target->id,
            'category_id' => $source->category_id,
            'name' => $source->name,
            // Sans le SKU, un second transfert ne retrouverait pas ce produit et en
            // créerait un doublon. Le code-barres n'est pas repris : il est dérivé de
            // l'identifiant du produit, donc propre à chaque ligne.
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
        ]);
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
        $products = $shop->products()->whereNull('parent_id')->get();

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
            'transferableProducts' => $products
                ->where('track_stock', true)
                ->where('stock_quantity', '>', 0)
                ->map(fn ($product) => [
                    'id' => $product->id,
                    'name' => $product->name,
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
