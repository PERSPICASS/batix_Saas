<?php

namespace App\Http\Controllers;

use App\Models\Customer;
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
        $shopId = $request->input('shop_id');
        $search = $request->input('search');
        
        $query = Customer::with('shop')
            ->orderBy('name');

        if ($shopId) {
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
            'shops' => Auth::user()->shops,
            'filters' => $request->only(['shop_id', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $shops = Auth::user()->shops;

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
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        $shop = Auth::user()->shops()->findOrFail($validated['shop_id']);
        
        $shop->customers()->create($validated);

        return redirect()->route('customers.index')->with('success', 'Client créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer)
    {
        $customer->load(['shop', 'invoices.items']);
        
        return Inertia::render('Customers/Show', [
            'customer' => $customer,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Customer $customer): Response
    {
        $shops = Auth::user()->shops;
        
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
            'shops' => $shops,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Vérifier que la boutique appartient à l'utilisateur
        Auth::user()->shops()->findOrFail($validated['shop_id']);
        
        $customer->update($validated);

        return redirect()->route('customers.index')->with('success', 'Client modifié avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        // Vérifier que la boutique du client appartient à l'utilisateur
        if ($customer->shop->user_id !== Auth::id()) {
            abort(403);
        }

        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'Client supprimé avec succès.');
    }
}
