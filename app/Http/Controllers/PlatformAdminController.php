<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Shop;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PlatformAdminController extends Controller
{
    /**
     * Display the platform admin dashboard.
     */
    public function index(): Response
    {
        // Vérifier que l'utilisateur est admin_platforme
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403, 'Accès réservé aux administrateurs de plateforme.');
        }

        // Statistiques globales
        $totalAccounts = User::where('role', 'super_admin')->count();
        $totalShops = Shop::count();
        $activeShops = Shop::where('is_active', true)->count();
        $totalUsers = User::count();

        // Statistiques des abonnements
        $activeSubscriptions = Subscription::where('status', 'active')->count();
        $trialSubscriptions = Subscription::where('status', 'trial')->count();
        $expiredSubscriptions = Subscription::where('status', 'expired')->count();
        $cancelledSubscriptions = Subscription::where('status', 'cancelled')->count();

        // Revenus mensuels depuis les abonnements
        $monthlyRevenue = Subscription::whereIn('status', ['active', 'trial'])
            ->sum('amount');

        // Évolution des inscriptions sur les 6 derniers mois
        $accountsGrowth = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = now()->subMonths($monthsAgo);
            $count = User::where('role', 'super_admin')
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            
            return [
                'month' => $date->format('M Y'),
                'count' => $count,
            ];
        });

        // Évolution des boutiques sur les 6 derniers mois
        $shopsGrowth = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = now()->subMonths($monthsAgo);
            $count = Shop::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            
            return [
                'month' => $date->format('M Y'),
                'count' => $count,
            ];
        });

        // Répartition des abonnements par plan
        $subscriptionsByPlan = Subscription::with('plan')
            ->whereIn('status', ['active', 'trial'])
            ->get()
            ->groupBy('plan_id')
            ->map(function ($subscriptions, $planId) {
                $plan = $subscriptions->first()->plan;
                return [
                    'name' => $plan->name,
                    'count' => $subscriptions->count(),
                    'revenue' => $subscriptions->sum('amount'),
                ];
            })
            ->values();

        // Évolution des revenus sur les 6 derniers mois
        $revenueGrowth = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = now()->subMonths($monthsAgo);
            $revenue = Subscription::whereYear('started_at', $date->year)
                ->whereMonth('started_at', $date->month)
                ->whereIn('status', ['active', 'trial'])
                ->sum('amount');
            
            return [
                'month' => $date->format('M Y'),
                'revenue' => $revenue,
            ];
        });

        // Comptes récents
        $recentAccounts = User::where('role', 'super_admin')
            ->with('shops')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'code_user' => $user->code_user,
                'shops_count' => $user->shops->count(),
                'created_at' => $user->created_at->format('Y-m-d H:i:s'),
            ]);

        // Boutiques récentes
        $recentShops = Shop::with('user')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($shop) => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'is_active' => $shop->is_active,
                'owner' => [
                    'id' => $shop->user->id,
                    'name' => $shop->user->name,
                    'email' => $shop->user->email,
                ],
                'created_at' => $shop->created_at->format('Y-m-d H:i:s'),
            ]);

        return Inertia::render('PlatformAdmin/Dashboard', [
            'stats' => [
                'total_accounts' => $totalAccounts,
                'total_shops' => $totalShops,
                'active_shops' => $activeShops,
                'total_users' => $totalUsers,
                'monthly_revenue' => $monthlyRevenue,
                'active_subscriptions' => $activeSubscriptions,
                'trial_subscriptions' => $trialSubscriptions,
                'expired_subscriptions' => $expiredSubscriptions,
                'cancelled_subscriptions' => $cancelledSubscriptions,
            ],
            'charts' => [
                'accounts_growth' => $accountsGrowth,
                'shops_growth' => $shopsGrowth,
                'subscriptions_by_plan' => $subscriptionsByPlan,
                'revenue_growth' => $revenueGrowth,
            ],
            'recent_accounts' => $recentAccounts,
            'recent_shops' => $recentShops,
        ]);
    }

    /**
     * Display all accounts (super_admin users).
     */
    public function accounts(Request $request): Response
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $query = User::where('role', 'super_admin')
            ->withCount([
                'shops',
                'shops as total_products_count' => function($query) {
                    $query->join('products', 'shops.id', '=', 'products.shop_id');
                }
            ])
            ->with('shops');

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('code_user', 'like', "%{$search}%");
            });
        }

        // Filtre par statut
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $accounts = $query->latest()->paginate(20)->through(fn($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'code_user' => $user->code_user,
            'is_active' => $user->is_active,
            'shops_count' => $user->shops_count ?? 0,
            'products_count' => $user->total_products_count ?? 0,
            'created_at' => $user->created_at->format('Y-m-d H:i:s'),
        ]);

        return Inertia::render('PlatformAdmin/Accounts', [
            'accounts' => $accounts,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Display all shops across all accounts.
     */
    public function shops(Request $request): Response
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $query = Shop::with('user');

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhereHas('user', function($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Filtre par statut
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $shops = $query->latest()->paginate(20)->through(fn($shop) => [
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'is_active' => $shop->is_active,
            'address' => $shop->address,
            'city' => $shop->city,
            'owner' => [
                'id' => $shop->user->id,
                'name' => $shop->user->name,
                'email' => $shop->user->email,
                'code_user' => $shop->user->code_user,
            ],
            'created_at' => $shop->created_at->format('Y-m-d H:i:s'),
        ]);

        return Inertia::render('PlatformAdmin/Shops', [
            'shops' => $shops,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Toggle account status.
     */
    public function toggleAccountStatus(User $user)
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        if ($user->role !== 'super_admin') {
            return back()->withErrors(['error' => 'Seuls les comptes super_admin peuvent être modifiés.']);
        }

        $user->update(['is_active' => !$user->is_active]);

        return back()->with('success', 'Statut du compte mis à jour.');
    }

    /**
     * Toggle shop status.
     */
    public function toggleShopStatus(Shop $shop)
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $shop->update(['is_active' => !$shop->is_active]);

        return back()->with('success', 'Statut de la boutique mis à jour.');
    }

    /**
     * Display all subscriptions.
     */
    public function subscriptions(Request $request): Response
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $query = Subscription::query()
            ->with(['user', 'plan'])
            ->latest();

        // Search by user name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by plan
        if ($request->filled('plan_id')) {
            $query->where('subscription_plan_id', $request->plan_id);
        }

        $subscriptions = $query->paginate(15)->withQueryString();

        // Get all plans for filter
        $plans = \App\Models\SubscriptionPlan::orderBy('name')->get();

        return Inertia::render('PlatformAdmin/Subscriptions/Index', [
            'subscriptions' => $subscriptions,
            'plans' => $plans,
            'filters' => $request->only(['search', 'status', 'plan_id']),
        ]);
    }

    /**
     * Cancel a subscription.
     */
    public function cancelSubscription(Subscription $subscription): RedirectResponse
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $subscription->cancel();

        return back()->with('success', 'Abonnement annulé avec succès.');
    }

    /**
     * Renew a subscription.
     */
    public function renewSubscription(Request $request, Subscription $subscription): RedirectResponse
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $validated = $request->validate([
            'months' => 'required|integer|min:1|max:12',
        ]);

        $subscription->renew($validated['months']);

        return back()->with('success', "Abonnement renouvelé pour {$validated['months']} mois.");
    }

    /**
     * Update subscription dates.
     */
    public function updateSubscriptionDates(Request $request, Subscription $subscription): RedirectResponse
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $validated = $request->validate([
            'started_at' => 'required|date',
            'expires_at' => 'nullable|date|after:started_at',
        ]);

        $subscription->update([
            'started_at' => $validated['started_at'],
            'expires_at' => $validated['expires_at'],
        ]);

        // Update status based on the new expiration date
        if ($validated['expires_at']) {
            $expiresAt = \Carbon\Carbon::parse($validated['expires_at']);
            if ($expiresAt->isPast()) {
                $subscription->update(['status' => 'expired']);
            } elseif ($subscription->status === 'expired') {
                $subscription->update(['status' => 'active']);
            }
        }

        return back()->with('success', 'Les dates de l\'abonnement ont été mises à jour avec succès.');
    }
}
