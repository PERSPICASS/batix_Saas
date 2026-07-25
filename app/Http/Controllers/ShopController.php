<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Et sa devise du compte : le formulaire n'en envoie aucune, si bien que la
        // colonne retombait sur son défaut de base — MAD — pour toute nouvelle boutique.
        $validated['currency'] = Shop::defaultCurrencyFor($user);

        $shop = $user->accessibleShopsQuery()->create($validated);

        // Log activity
        ActivityLogger::created($shop, $shop->name);

        return redirect()->route('shops.index', ['code_user' => request()->route('code_user')])->with('success', 'Boutique créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Shop $shop)
    {
        $this->authorize('view', $shop);
        
        return Inertia::render('Shops/Show', [
            'shop' => $shop,
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
