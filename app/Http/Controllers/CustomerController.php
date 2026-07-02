<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $activeShopId = get_active_shop_id();
        $shopId = $request->input('shop_id');
        $search = $request->input('search');
        
        $query = Customer::with('shop')
            ->orderBy('name');

        // Filtrer par boutique active si sélectionnée
        if ($activeShopId) {
            $query->where('shop_id', $activeShopId);
        } elseif ($shopId) {
            $query->where('shop_id', $shopId);
        } else {
            // Afficher les clients de toutes les boutiques de l'utilisateur
            $query->whereHas('shop', function ($q) {
                $q->where('user_id', Auth::id());
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $customers = $query->paginate(20);

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'shops' => Auth::user()->accessibleShops(),
            'filters' => $request->only(['shop_id', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $shops = Auth::user()->accessibleShops();

        return Inertia::render('Customers/Create', [
            'shops' => $shops,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        $shop = Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        
        $customer = $shop->customers()->create($validated);

        // Log activity
        ActivityLogger::created($customer, $customer->name);

        return redirect()->route('customers.index', ['code_user' => request()->route('code_user')])->with('success', 'Client créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $code_user, Customer $customer)
    {
        $customer->load(['shop', 'invoices.items']);
        
        return Inertia::render('Customers/Show', [
            'customer' => $customer,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $code_user, Customer $customer): Response
    {
        $shops = Auth::user()->accessibleShops();
        
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
            'shops' => $shops,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $code_user, Customer $customer)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        Auth::user()->accessibleShopsQuery()->findOrFail($validated['shop_id']);
        
        $customer->update($validated);

        // Log activity
        ActivityLogger::updated($customer, [], $customer->name);

        return redirect()->route('customers.index', ['code_user' => request()->route('code_user')])->with('success', 'Client modifié avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $code_user, Customer $customer)
    {
        // Vérifier que la boutique du client appartient à l'utilisateur
        if ($customer->shop->user_id !== Auth::id()) {
            abort(403);
        }

        // Sauvegarder le nom avant suppression
        $customerName = $customer->name;
        
        $customer->delete();

        // Log activity
        ActivityLogger::deleted($customer, $customerName);

        return redirect()->route('customers.index', ['code_user' => request()->route('code_user')])->with('success', 'Client supprimé avec succès.');
    }
}
