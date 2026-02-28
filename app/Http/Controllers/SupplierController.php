<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        $userShopIds = Auth::user()->accessibleShops()->pluck('id');
        
        $query = Supplier::with('shops')
            ->whereHas('shops', function ($q) use ($userShopIds, $activeShopId) {
                $q->whereIn('shops.id', $userShopIds);
                if ($activeShopId) {
                    $q->where('shops.id', $activeShopId);
                }
            });

        // Search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status') && $request->status !== '') {
            $query->where('is_active', $request->status === 'active');
        }

        $suppliers = $query->orderBy('name')->paginate(15);

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Suppliers/Create', [
            'shops' => Auth::user()->accessibleShops(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shop_ids' => 'required|array|min:1',
            'shop_ids.*' => 'exists:shops,id',
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Vérifier que toutes les boutiques appartiennent à l'utilisateur
        $userShopIds = Auth::user()->accessibleShops()->pluck('id')->toArray();
        foreach ($validated['shop_ids'] as $shopId) {
            if (!in_array($shopId, $userShopIds)) {
                abort(403, 'Accès non autorisé à cette boutique.');
            }
        }

        $shopIds = $validated['shop_ids'];
        unset($validated['shop_ids']);

        $supplier = Supplier::create($validated);
        $supplier->shops()->attach($shopIds);

        // Log activity
        ActivityLogger::created($supplier, "Fournisseur créé: {$supplier->name}");

        return redirect()->route('suppliers.index', ['code_user' => request()->route('code_user')])->with('success', 'Fournisseur créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Supplier $supplier): Response
    {
        $userShopIds = Auth::user()->accessibleShops()->pluck('id');
        
        // Vérifier que le fournisseur est associé à au moins une boutique de l'utilisateur
        if (!$supplier->shops()->whereIn('shops.id', $userShopIds)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        $supplier->load(['shops', 'products']);
        
        return Inertia::render('Suppliers/Show', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $code_user, Supplier $supplier): Response
    {
        $userShopIds = Auth::user()->accessibleShops()->pluck('id');
        
        // Vérifier que le fournisseur est associé à au moins une boutique de l'utilisateur
        if (!$supplier->shops()->whereIn('shops.id', $userShopIds)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        $supplier->load('shops');

        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier,
            'shops' => Auth::user()->accessibleShops(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $code_user, Supplier $supplier): RedirectResponse
    {
        $userShopIds = Auth::user()->accessibleShops()->pluck('id');
        
        // Vérifier que le fournisseur est associé à au moins une boutique de l'utilisateur
        if (!$supplier->shops()->whereIn('shops.id', $userShopIds)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        $validated = $request->validate([
            'shop_ids' => 'required|array|min:1',
            'shop_ids.*' => 'exists:shops,id',
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Vérifier que toutes les boutiques appartiennent à l'utilisateur
        $userShopIdsArray = $userShopIds->toArray();
        foreach ($validated['shop_ids'] as $shopId) {
            if (!in_array($shopId, $userShopIdsArray)) {
                abort(403, 'Accès non autorisé à cette boutique.');
            }
        }

        $shopIds = $validated['shop_ids'];
        unset($validated['shop_ids']);

        $supplier->update($validated);
        $supplier->shops()->sync($shopIds);

        // Log activity
        ActivityLogger::updated($supplier, [], "Fournisseur mis à jour: {$supplier->name}");

        return redirect()->route('suppliers.index', ['code_user' => request()->route('code_user')])->with('success', 'Fournisseur mis à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $code_user, Supplier $supplier): RedirectResponse
    {
        $userShopIds = Auth::user()->accessibleShops()->pluck('id');
        
        // Vérifier que le fournisseur est associé à au moins une boutique de l'utilisateur
        if (!$supplier->shops()->whereIn('shops.id', $userShopIds)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        // Check if supplier has products
        if ($supplier->products()->count() > 0) {
            return back()->withErrors(['error' => 'Impossible de supprimer ce fournisseur car il a des produits associés.']);
        }

        // Sauvegarder le nom avant suppression
        $supplierName = $supplier->name;
        
        $supplier->shops()->detach();
        $supplier->delete();

        // Log activity
        ActivityLogger::deleted($supplier, "Fournisseur supprimé: {$supplierName}");

        return redirect()->route('suppliers.index', ['code_user' => request()->route('code_user')])->with('success', 'Fournisseur supprimé avec succès.');
    }
}
