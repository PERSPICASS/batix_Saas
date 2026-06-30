<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\FixedCost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;

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

        // Charges fixes mensuelles (en EUR uniquement)
        $monthlyFixedCosts = FixedCost::where('is_active', true)
            ->where('currency', 'EUR')
            ->where('billing_cycle', 'monthly')
            ->sum('amount_monthly') ?? 0;

        // Profit net (Revenus - Charges fixes)
        $monthlyProfit = $monthlyRevenue - $monthlyFixedCosts;

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
                'monthly_fixed_costs' => $monthlyFixedCosts,
                'monthly_profit' => $monthlyProfit,
                'profit_margin' => $monthlyRevenue > 0 ? round(($monthlyProfit / $monthlyRevenue) * 100, 1) : 0,
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
     * MRR Dashboard complet : MRR, ARR, Churn, New MRR, Expansion, NRR
     */
    public function mrrDashboard(): Response
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();

        // ── MRR courant ────────────────────────────────────────────────────
        // MRR = somme des montants normalisés en mensuel des abonnements actifs
        $activeSubs = Subscription::with('plan')
            ->where('status', 'active')
            ->get();

        $currentMrr = $activeSubs->sum(function ($sub) {
            return $sub->billing_cycle === 'yearly' ? $sub->amount / 12 : $sub->amount;
        });

        // MRR mois précédent
        $lastMonthSubs = Subscription::with('plan')
            ->where('status', 'active')
            ->where('started_at', '<=', $lastMonth->endOfMonth())
            ->where(function ($q) use ($lastMonth) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', $lastMonth->startOfMonth());
            })
            ->get();

        $lastMrr = $lastMonthSubs->sum(function ($sub) {
            return $sub->billing_cycle === 'yearly' ? $sub->amount / 12 : $sub->amount;
        });

        $mrrGrowth = $lastMrr > 0 ? round((($currentMrr - $lastMrr) / $lastMrr) * 100, 1) : 0;

        // ── ARR ────────────────────────────────────────────────────────────
        $arr = $currentMrr * 12;

        // ── ARPU (Average Revenue Per User) ────────────────────────────────
        $activeCount = $activeSubs->count();
        $arpu = $activeCount > 0 ? round($currentMrr / $activeCount) : 0;

        // ── Churn Rate ─────────────────────────────────────────────────────
        // Churned = annulés ou expirés ce mois-ci
        $churnedThisMonth = Subscription::where(function ($q) use ($now) {
            $q->where('status', 'cancelled')
              ->whereMonth('cancelled_at', $now->month)
              ->whereYear('cancelled_at', $now->year);
        })->orWhere(function ($q) use ($now) {
            $q->where('status', 'expired')
              ->whereMonth('expires_at', $now->month)
              ->whereYear('expires_at', $now->year);
        })->count();

        $startOfMonthActive = $lastMonthSubs->count();
        $churnRate = $startOfMonthActive > 0
            ? round(($churnedThisMonth / $startOfMonthActive) * 100, 2)
            : 0;

        // ── MRR Churned (valeur perdue) ─────────────────────────────────────
        $churnedMrr = Subscription::where(function ($q) use ($now) {
            $q->where('status', 'cancelled')
              ->whereMonth('cancelled_at', $now->month)
              ->whereYear('cancelled_at', $now->year);
        })->orWhere(function ($q) use ($now) {
            $q->where('status', 'expired')
              ->whereMonth('expires_at', $now->month)
              ->whereYear('expires_at', $now->year);
        })->get()->sum(function ($sub) {
            return $sub->billing_cycle === 'yearly' ? $sub->amount / 12 : $sub->amount;
        });

        // ── New MRR (nouveaux abonnements ce mois) ─────────────────────────
        $newMrr = Subscription::where('status', 'active')
            ->whereMonth('started_at', $now->month)
            ->whereYear('started_at', $now->year)
            ->get()
            ->sum(function ($sub) {
                return $sub->billing_cycle === 'yearly' ? $sub->amount / 12 : $sub->amount;
            });

        // ── Net Revenue Retention (NRR) ─────────────────────────────────────
        // NRR = (MRR fin de période - Churn MRR) / MRR début de période × 100
        $nrr = $lastMrr > 0
            ? round((($currentMrr - $churnedMrr) / $lastMrr) * 100, 1)
            : 100;

        // ── LTV estimée ─────────────────────────────────────────────────────
        // LTV = ARPU / Churn Rate (mensuel)
        $monthlyChurnRate = $churnRate / 100;
        $ltv = $monthlyChurnRate > 0 ? round($arpu / $monthlyChurnRate) : 0;

        // ── Évolution MRR sur 12 mois ────────────────────────────────────────
        $mrrHistory = collect(range(11, 0))->map(function ($monthsAgo) {
            $date = Carbon::now()->subMonths($monthsAgo);

            $subs = Subscription::where('status', 'active')
                ->where('started_at', '<=', $date->copy()->endOfMonth())
                ->where(function ($q) use ($date) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', $date->copy()->startOfMonth());
                })
                ->get();

            $mrr = $subs->sum(fn($s) => $s->billing_cycle === 'yearly' ? $s->amount / 12 : $s->amount);

            $newSubs = Subscription::where('status', 'active')
                ->whereYear('started_at', $date->year)
                ->whereMonth('started_at', $date->month)
                ->get();
            $newMrrMonth = $newSubs->sum(fn($s) => $s->billing_cycle === 'yearly' ? $s->amount / 12 : $s->amount);

            $churned = Subscription::where(function ($q) use ($date) {
                $q->where('status', 'cancelled')
                  ->whereYear('cancelled_at', $date->year)
                  ->whereMonth('cancelled_at', $date->month);
            })->orWhere(function ($q) use ($date) {
                $q->where('status', 'expired')
                  ->whereYear('expires_at', $date->year)
                  ->whereMonth('expires_at', $date->month);
            })->get();

            $churnedMrrMonth = $churned->sum(fn($s) => $s->billing_cycle === 'yearly' ? $s->amount / 12 : $s->amount);

            return [
                'month'      => $date->format('M Y'),
                'mrr'        => round($mrr),
                'new_mrr'    => round($newMrrMonth),
                'churned_mrr'=> round($churnedMrrMonth),
                'count'      => $subs->count(),
            ];
        });

        // ── Churn par mois (12 mois) ─────────────────────────────────────────
        $churnHistory = collect(range(11, 0))->map(function ($monthsAgo) {
            $date = Carbon::now()->subMonths($monthsAgo);

            $startSubs = Subscription::where('status', 'active')
                ->where('started_at', '<', $date->copy()->startOfMonth())
                ->where(function ($q) use ($date) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>=', $date->copy()->startOfMonth());
                })
                ->count();

            $churned = Subscription::where(function ($q) use ($date) {
                $q->where('status', 'cancelled')
                  ->whereYear('cancelled_at', $date->year)
                  ->whereMonth('cancelled_at', $date->month);
            })->orWhere(function ($q) use ($date) {
                $q->where('status', 'expired')
                  ->whereYear('expires_at', $date->year)
                  ->whereMonth('expires_at', $date->month);
            })->count();

            $rate = $startSubs > 0 ? round(($churned / $startSubs) * 100, 2) : 0;

            return [
                'month'        => $date->format('M Y'),
                'churned'      => $churned,
                'churn_rate'   => $rate,
            ];
        });

        // ── Revenue réel (factures payées) sur 12 mois ──────────────────────
        $revenueHistory = collect(range(11, 0))->map(function ($monthsAgo) {
            $date = Carbon::now()->subMonths($monthsAgo);
            $revenue = SubscriptionInvoice::where('status', 'paid')
                ->whereYear('paid_at', $date->year)
                ->whereMonth('paid_at', $date->month)
                ->sum('total');

            return [
                'month'   => $date->format('M Y'),
                'revenue' => round($revenue),
            ];
        });

        // ── Répartition MRR par plan ──────────────────────────────────────────
        $mrrByPlan = Subscription::with('plan')
            ->where('status', 'active')
            ->get()
            ->groupBy('plan_id')
            ->map(function ($subs) {
                $plan = $subs->first()->plan;
                $mrr = $subs->sum(fn($s) => $s->billing_cycle === 'yearly' ? $s->amount / 12 : $s->amount);
                return [
                    'name'  => $plan->name,
                    'mrr'   => round($mrr),
                    'count' => $subs->count(),
                    'color' => '#f59e0b',
                ];
            })
            ->values();

        // ── Top churners récents (30 derniers jours) ─────────────────────────
        $recentChurns = Subscription::with(['user', 'plan'])
            ->where(function ($q) {
                $q->where('status', 'cancelled')
                  ->where('cancelled_at', '>=', Carbon::now()->subDays(30));
            })->orWhere(function ($q) {
                $q->where('status', 'expired')
                  ->where('expires_at', '>=', Carbon::now()->subDays(30))
                  ->where('expires_at', '<=', Carbon::now());
            })
            ->latest('cancelled_at')
            ->take(10)
            ->get()
            ->map(fn($s) => [
                'user'          => $s->user->name ?? 'N/A',
                'email'         => $s->user->email ?? '',
                'plan'          => $s->plan->name ?? 'N/A',
                'amount'        => $s->billing_cycle === 'yearly' ? round($s->amount / 12) : $s->amount,
                'churned_at'    => $s->cancelled_at ?? $s->expires_at,
                'reason'        => $s->status,
            ]);

        // ── Abonnements à risque (expirent dans 30 jours) ────────────────────
        $atRisk = Subscription::with(['user', 'plan'])
            ->where('status', 'active')
            ->whereBetween('expires_at', [Carbon::now(), Carbon::now()->addDays(30)])
            ->orderBy('expires_at')
            ->take(10)
            ->get()
            ->map(fn($s) => [
                'user'       => $s->user->name ?? 'N/A',
                'email'      => $s->user->email ?? '',
                'plan'       => $s->plan->name ?? 'N/A',
                'expires_at' => $s->expires_at,
                'days_left'  => Carbon::now()->diffInDays($s->expires_at),
                'amount'     => $s->billing_cycle === 'yearly' ? round($s->amount / 12) : $s->amount,
            ]);

        return Inertia::render('PlatformAdmin/MRR', [
            'kpis' => [
                'mrr'          => round($currentMrr),
                'arr'          => round($arr),
                'arpu'         => $arpu,
                'mrr_growth'   => $mrrGrowth,
                'churn_rate'   => $churnRate,
                'churned_mrr'  => round($churnedMrr),
                'new_mrr'      => round($newMrr),
                'nrr'          => $nrr,
                'ltv'          => $ltv,
                'active_count' => $activeCount,
            ],
            'mrr_history'    => $mrrHistory,
            'churn_history'  => $churnHistory,
            'revenue_history'=> $revenueHistory,
            'mrr_by_plan'    => $mrrByPlan,
            'recent_churns'  => $recentChurns,
            'at_risk'        => $atRisk,
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
     * Activate a pending subscription.
     */
    public function activateSubscription(Subscription $subscription): RedirectResponse
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $subscription->update([
            'status' => 'active',
            'started_at' => $subscription->started_at ?? now(),
        ]);

        // Mark related pending invoices as paid
        $subscription->invoices()->where('status', 'pending')->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return back()->with('success', 'Abonnement activé avec succès.');
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

    /**
     * Display products of a specific shop for platform admin.
     */
    public function shopProducts(Request $request, Shop $shop): Response
    {
        if (auth()->user()->role !== 'admin_platforme') {
            abort(403);
        }

        $query = \App\Models\Product::with(['category', 'subcategory'])
            ->where('shop_id', $shop->id)
            ->orderBy('created_at', 'desc');

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Filtre par catégorie
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filtre par statut
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($request->status === 'low_stock') {
                $query->where('track_stock', true)
                      ->whereNotNull('min_stock_alert')
                      ->whereColumn('stock_quantity', '<=', 'min_stock_alert');
            }
        }

        $products = $query->paginate(20)->through(fn($product) => [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'price' => $product->price,
            'cost_price' => $product->cost_price,
            'stock_quantity' => $product->stock_quantity,
            'min_stock_alert' => $product->min_stock_alert,
            'track_stock' => $product->track_stock,
            'is_active' => $product->is_active,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null,
            'subcategory' => $product->subcategory ? [
                'id' => $product->subcategory->id,
                'name' => $product->subcategory->name,
            ] : null,
            'created_at' => $product->created_at->format('Y-m-d H:i:s'),
        ]);

        $categories = \App\Models\Category::orderBy('order')->orderBy('name')->get();

        return Inertia::render('PlatformAdmin/ShopProducts', [
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'owner' => [
                    'id' => $shop->user->id,
                    'name' => $shop->user->name,
                    'email' => $shop->user->email,
                    'code_user' => $shop->user->code_user,
                ],
            ],
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'status']),
        ]);
    }
}
