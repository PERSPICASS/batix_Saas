<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
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
        
        $query = Supplier::with('shop')
            ->whereHas('shop', function ($q) use ($activeShopId) {
                $q->where('user_id', Auth::id());
                if ($activeShopId) {
                    $q->where('id', $activeShopId);
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
            'shop_id' => 'required|exists:shops,id',
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

        // Vérifier que la boutique appartient à l'utilisateur
        Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);

        Supplier::create($validated);

        return redirect()->route('suppliers.index')->with('success', 'Fournisseur créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Supplier $supplier): Response
    {
        // Vérifier que le fournisseur appartient à une boutique de l'utilisateur
        if (!Auth::user()->accessibleShopsQuery()->where('id', $supplier->shop_id)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        $supplier->load(['shop', 'products']);
        
        return Inertia::render('Suppliers/Show', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Supplier $supplier): Response
    {
        // Vérifier que le fournisseur appartient à une boutique de l'utilisateur
        if (!Auth::user()->accessibleShopsQuery()->where('id', $supplier->shop_id)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier,
            'shops' => Auth::user()->accessibleShops(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        // Vérifier que le fournisseur appartient à une boutique de l'utilisateur
        if (!Auth::user()->accessibleShopsQuery()->where('id', $supplier->shop_id)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
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

        // Vérifier que la nouvelle boutique appartient à l'utilisateur
        Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);        $supplier->update($validated);

        return redirect()->route('suppliers.index')->with('success', 'Fournisseur mis à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier): RedirectResponse
    {
        // Vérifier que le fournisseur appartient à une boutique de l'utilisateur
        if (!Auth::user()->accessibleShopsQuery()->where('id', $supplier->shop_id)->exists()) {
            abort(403, 'Accès non autorisé.');
        }

        // Check if supplier has products
        if ($supplier->products()->count() > 0) {
            return back()->withErrors(['error' => 'Impossible de supprimer ce fournisseur car il a des produits associés.']);
        }

        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Fournisseur supprimé avec succès.');
    }
}
