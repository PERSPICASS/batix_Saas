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
        $shops = Auth::user()->accessibleShopsQuery()->latest()->get();
        
        return Inertia::render('Shops/Index', [
            'shops' => $shops,
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

        $shop = Auth::user()->accessibleShopsQuery()->create($validated);

        // Log activity
        ActivityLogger::created($shop, "Boutique créée: {$shop->name}");

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
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'tax_id' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $shop->update($validated);

        // Log activity
        ActivityLogger::updated($shop, [], "Boutique mise à jour: {$shop->name}");

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
        ActivityLogger::deleted($shop, "Boutique supprimée: {$shopName}");

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
    public function storeInitial(Request $request): RedirectResponse
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

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
        ]);

        // Créer la première boutique de l'utilisateur
        $shop = $user->shops()->create([
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'currency' => 'USD',
            'country' => 'Maroc',
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

        // ✨ Attribuer automatiquement le plan FREE (30 jours)
        $freePlan = SubscriptionPlan::where('slug', 'free')->first();
        
        if ($freePlan) {
            Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $freePlan->id,
                'status' => 'trial',
                'amount' => 0, // Plan gratuit
                'started_at' => now(),
                'expires_at' => now()->addDays(30), // 30 jours d'essai gratuit
            ]);
        }

        // Définir la boutique active en session
        session(['active_shop_id' => $shop->id]);

        // Log activity
        ActivityLogger::created($shop, "Première boutique créée: {$shop->name}");

        // Rediriger vers le dashboard avec message de bienvenue
        return redirect()
            ->route('dashboard', ['code_user' => $user->code_user])
            ->with('success', 'Bienvenue ! Votre boutique a été créée avec succès. Vous disposez de 30 jours d\'essai gratuit.');
    }
}
