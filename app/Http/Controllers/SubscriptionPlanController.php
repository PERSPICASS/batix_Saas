<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class SubscriptionPlanController extends Controller
{
    /**
     * Display a listing of subscription plans.
     */
    public function index(Request $request): Response
    {
        $query = SubscriptionPlan::query()
            ->withCount('subscriptions')
            ->orderBy('price');

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        $plans = $query->paginate(10)->withQueryString();

        return Inertia::render('PlatformAdmin/SubscriptionPlans/Index', [
            'plans' => $plans,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new plan.
     */
    public function create(): Response
    {
        return Inertia::render('PlatformAdmin/SubscriptionPlans/Create');
    }

    /**
     * Store a newly created plan.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subscription_plans,slug',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'max_shops' => 'required|integer|min:-1',
            'max_users' => 'required|integer|min:-1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        SubscriptionPlan::create($validated);

        return redirect()->route('platform.subscriptions.index')
            ->with('success', 'Plan d\'abonnement créé avec succès.');
    }

    /**
     * Show the form for editing the plan.
     */
    public function edit(SubscriptionPlan $plan): Response
    {
        $plan->load('subscriptions');
        
        return Inertia::render('PlatformAdmin/SubscriptionPlans/Edit', [
            'plan' => $plan,
            'activeSubscriptionsCount' => $plan->activeSubscriptionsCount(),
        ]);
    }

    /**
     * Update the specified plan.
     */
    public function update(Request $request, SubscriptionPlan $plan): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subscription_plans,slug,' . $plan->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'max_shops' => 'required|integer|min:-1',
            'max_users' => 'required|integer|min:-1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $plan->update($validated);

        return redirect()->route('platform.subscriptions.index')
            ->with('success', 'Plan d\'abonnement mis à jour avec succès.');
    }

    /**
     * Remove the specified plan.
     */
    public function destroy(SubscriptionPlan $plan): RedirectResponse
    {
        // Check if plan has active subscriptions
        if ($plan->activeSubscriptionsCount() > 0) {
            return back()->with('error', 'Impossible de supprimer un plan avec des abonnements actifs.');
        }

        $plan->delete();

        return redirect()->route('platform.subscriptions.index')
            ->with('success', 'Plan d\'abonnement supprimé avec succès.');
    }

    /**
     * Toggle plan active status.
     */
    public function toggleStatus(SubscriptionPlan $plan): RedirectResponse
    {
        $plan->update([
            'is_active' => !$plan->is_active,
        ]);

        $status = $plan->is_active ? 'activé' : 'désactivé';

        return back()->with('success', "Plan {$status} avec succès.");
    }

    /**
     * Display plans for users to choose (public page).
     */
    public function publicIndex(): Response
    {
        $plans = SubscriptionPlan::where('is_active', true)
            ->orderBy('price')
            ->get();

        return Inertia::render('Plans/Index', [
            'plans' => $plans,
        ]);
    }
}
