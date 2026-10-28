<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
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
        } elseif ($shopId && Auth::user()->accessibleShopsQuery()->where('id', $shopId)->exists()) {
            $query->where('shop_id', $shopId);
        } else {
            // Afficher les clients de toutes les boutiques de l'utilisateur
            $query->whereHas('shop', function ($q) {
                $q->where('user_id', Auth::id());
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereContains('name', $search)
                  ->orWhereContains('email', $search)
                  ->orWhereContains('phone', $search);
            });
        }

        $customers = $query->withSum('credits as credit_balance', 'amount')->paginate(20);

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
            // FNE (Côte d'Ivoire) : le NCC est l'identifiant fiscal du client, exigé
            // par la DGI quand le client est une entreprise (B2B).
            'ncc' => 'nullable|string|max:30|required_if:fne_template,B2B',
            'fne_template' => 'nullable|in:B2C,B2B,B2G',
        ], [
            'ncc.required_if' => 'Le NCC est obligatoire pour un client entreprise (B2B).',
        ]);

        $validated['fne_template'] = $validated['fne_template'] ?? 'B2C';

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
        if (!Auth::user()->accessibleShopsQuery()->where('id', $customer->shop_id)->exists()) {
            abort(403);
        }

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
        if (!Auth::user()->accessibleShopsQuery()->where('id', $customer->shop_id)->exists()) {
            abort(403);
        }

        $shops = Auth::user()->accessibleShops();

        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
            // L'avoir : son solde et les mouvements qui l'expliquent.
            'credit' => [
                'balance' => $customer->creditBalance(),
                'movements' => $customer->credits()->with('sale:id,ticket_number')->latest()->limit(50)->get()
                    ->map(fn ($m) => [
                        'id' => $m->id, 'amount' => (float) $m->amount, 'type' => $m->type, 'notes' => $m->notes,
                        'date' => $m->created_at->toIso8601String(),
                        'sale' => $m->sale ? ['id' => $m->sale->id, 'ticket_number' => $m->sale->ticket_number] : null,
                    ]),
            ],
            'shops' => $shops,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $code_user, Customer $customer)
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $customer->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'shop_id' => [
                'required',
                Rule::exists('shops', 'id')->whereIn('id', Auth::user()->accessibleShopsQuery()->pluck('id')),
            ],
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
            // FNE (Côte d'Ivoire) : le NCC est l'identifiant fiscal du client, exigé
            // par la DGI quand le client est une entreprise (B2B).
            'ncc' => 'nullable|string|max:30|required_if:fne_template,B2B',
            'fne_template' => 'nullable|in:B2C,B2B,B2G',
        ], [
            'ncc.required_if' => 'Le NCC est obligatoire pour un client entreprise (B2B).',
        ]);

        $validated['fne_template'] = $validated['fne_template'] ?? 'B2C';

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
        if (!Auth::user()->accessibleShopsQuery()->where('id', $customer->shop_id)->exists()) {
            abort(403);
        }

        // Son avoir disparaîtrait avec lui (cascade) : c'est de l'argent dû au client.
        if (($balance = $customer->creditBalance()) > 0) {
            return back()->with('error', "Ce client a encore un avoir de " . number_format($balance, 0, ',', ' ') . " : il ne peut pas être supprimé tant qu'il ne l'a pas utilisé.");
        }

        // Sauvegarder le nom avant suppression
        $customerName = $customer->name;
        
        $customer->delete();

        // Log activity
        ActivityLogger::deleted($customer, $customerName);

        return redirect()->route('customers.index', ['code_user' => request()->route('code_user')])->with('success', 'Client supprimé avec succès.');
    }
}
