<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class SubscriptionPlanController extends Controller implements HasMiddleware
{
    /** Everything but the public pricing page is platform-admin only. */
    public static function middleware(): array
    {
        return [new Middleware('platform.admin', except: ['publicIndex'])];
    }

    /**
     * Display a listing of subscription plans.
     */
    public function index(Request $request): Response
    {
        $query = SubscriptionPlan::query()
            ->withCount('subscriptions')
            ->orderBy('sort_order')
            ->orderBy('price');

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereLike('name', "%{$search}%")
                  ->orWhereLike('slug', "%{$search}%");
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
            'max_shops'    => 'required|integer|min:-1',
            'max_users'    => 'required|integer|min:-1',
            'max_products' => 'required|integer|min:-1',
            'max_depots'   => 'required|integer|min:-1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        SubscriptionPlan::create($validated);

        return redirect()->route('platform.subscriptions.index')
            ->with('success', __('platform.flash.plan_created'));
    }

    /**
     * Show the form for editing the plan.
     */
    public function edit(SubscriptionPlan $plan): Response
    {
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
            'max_shops'    => 'required|integer|min:-1',
            'max_users'    => 'required|integer|min:-1',
            'max_products' => 'required|integer|min:-1',
            'max_depots'   => 'required|integer|min:-1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $plan->update($validated);

        return redirect()->route('platform.subscriptions.index')
            ->with('success', __('platform.flash.plan_updated'));
    }

    /**
     * Remove the specified plan.
     */
    public function destroy(SubscriptionPlan $plan): RedirectResponse
    {
        // subscriptions.subscription_plan_id is RESTRICT: any subscription ever
        // taken on this plan (even expired) blocks the delete at the DB level.
        if ($plan->subscriptions()->exists()) {
            return back()->with('error', __('platform.flash.plan_has_subscriptions'));
        }

        $plan->delete();

        return redirect()->route('platform.subscriptions.index')
            ->with('success', __('platform.flash.plan_deleted'));
    }

    /**
     * Toggle plan active status.
     */
    public function toggleStatus(SubscriptionPlan $plan): RedirectResponse
    {
        $plan->update([
            'is_active' => !$plan->is_active,
        ]);

        return back()->with('success', __($plan->is_active ? 'platform.flash.plan_enabled' : 'platform.flash.plan_disabled'));
    }

    /**
     * Display plans for users to choose (public page).
     */
    public function publicIndex(): Response
    {
        $plans = SubscriptionPlan::where('is_active', true)
            ->where('slug', '!=', 'free')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($plan) => array_merge($plan->toArray(), [
                'price_eur'             => $plan->price_eur,
                'price_fcfa'            => $plan->price_fcfa,
                'formatted_price'       => $plan->formatted_price,
                'has_unlimited_shops'   => $plan->hasUnlimitedShops(),
                'has_unlimited_users'   => $plan->hasUnlimitedUsers(),
                'has_unlimited_products'=> $plan->hasUnlimitedProducts(),
                'has_unlimited_depots'  => $plan->hasUnlimitedDepots(),
            ]));

        return Inertia::render('Plans/Index', [
            'plans' => $plans,
        ]);
    }
}
