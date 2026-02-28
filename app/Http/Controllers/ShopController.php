<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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
            'country' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'tax_id' => 'nullable|string|max:50',
            'currency' => 'nullable|string|max:3',
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
            'country' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'tax_id' => 'nullable|string|max:50',
            'currency' => 'nullable|string|max:3',
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
}
