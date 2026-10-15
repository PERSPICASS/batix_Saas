<?php

namespace App\Http\Controllers;

use App\Mail\SubscriptionInvoiceMail;
use App\Models\User;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Services\PlatformMetrics;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;

class PlatformAdminController extends Controller implements HasMiddleware
{
    /**
     * Defense in depth: the routes already carry platform.admin, but a
     * controller this privileged must not depend on being routed correctly.
     */
    public static function middleware(): array
    {
        return ['platform.admin'];
    }

    /**
     * Display the platform admin dashboard.
     */
    public function index(PlatformMetrics $metrics): Response
    {
        // Statistiques globales
        $totalAccounts = User::where('role', 'super_admin')->count();
        $totalShops = Shop::count();
        $activeShops = Shop::where('is_active', true)->count();
        $totalUsers = User::where('role', '!=', 'admin_platforme')->count();

        // Statistiques des abonnements
        $activeSubscriptions = Subscription::where('status', 'active')->count();
        $trialSubscriptions = Subscription::where('status', 'trial')->count();
        $expiredSubscriptions = Subscription::where('status', 'expired')->count();
        $cancelledSubscriptions = Subscription::where('status', 'cancelled')->count();

        // Revenu mensuel = MRR (abonnements payants, annuel ramené au mois), en FCFA,
        // comme sur la page MRR. Les charges sont converties en FCFA elles aussi.
        $paying = $metrics->payingAt(now());
        $monthlyRevenue = $paying->sum(fn ($s) => PlatformMetrics::monthlyAmount($s));
        $monthlyFixedCosts = $metrics->monthlyFixedCosts();
        $monthlyProfit = $monthlyRevenue - $monthlyFixedCosts;

        // Évolution des inscriptions sur les 6 derniers mois
        $accountsGrowth = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = now()->startOfMonth()->subMonths($monthsAgo);

            return [
                'month' => $date->format('Y-m'),
                'count' => User::where('role', 'super_admin')
                    ->whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])
                    ->count(),
            ];
        });

        // Évolution des boutiques sur les 6 derniers mois
        $shopsGrowth = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = now()->startOfMonth()->subMonths($monthsAgo);

            return [
                'month' => $date->format('Y-m'),
                'count' => Shop::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count(),
            ];
        });

        // Répartition des abonnements payants par plan
        $subscriptionsByPlan = $paying
            ->groupBy('subscription_plan_id')
            ->map(fn ($subs) => [
                'name' => $subs->first()->plan?->name ?? '—',
                'count' => $subs->count(),
                'revenue' => round($subs->sum(fn ($s) => PlatformMetrics::monthlyAmount($s))),
            ])
            ->values();

        // Encaissements réels (factures d'abonnement payées) sur 6 mois
        $revenueGrowth = collect(range(5, 0))->map(function ($monthsAgo) {
            $date = now()->startOfMonth()->subMonths($monthsAgo);

            return [
                'month' => $date->format('Y-m'),
                'revenue' => round((float) SubscriptionInvoice::where('status', 'paid')
                    ->whereBetween('paid_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])
                    ->sum('total')),
            ];
        });

        // Comptes récents
        $recentAccounts = User::where('role', 'super_admin')
            ->withCount('shops')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'code_user' => $user->code_user,
                'shops_count' => $user->shops_count,
                'created_at' => $user->created_at?->toDateTimeString(),
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
                    'id' => $shop->user?->id,
                    'name' => $shop->user?->name,
                    'email' => $shop->user?->email,
                ],
                'created_at' => $shop->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('PlatformAdmin/Dashboard', [
            'stats' => [
                'total_accounts' => $totalAccounts,
                'total_shops' => $totalShops,
                'active_shops' => $activeShops,
                'total_users' => $totalUsers,
                'monthly_revenue' => round($monthlyRevenue),
                'monthly_fixed_costs' => round($monthlyFixedCosts),
                'monthly_profit' => round($monthlyProfit),
                'profit_margin' => $monthlyRevenue > 0 ? round(($monthlyProfit / $monthlyRevenue) * 100, 1) : 0,
                'paying_subscriptions' => $paying->count(),
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
     * MRR Dashboard complet : MRR, ARR, Churn, New MRR, Expansion, NRR.
     * Tous les montants sont en FCFA ; voir PlatformMetrics pour la méthode.
     */
    public function mrrDashboard(PlatformMetrics $metrics): Response
    {
        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();

        // ── Mois en cours : du 1er du mois à maintenant ────────────────────
        $current = $metrics->movements($monthStart, $now);
        $currentMrr = $current['end_mrr'];
        $lastMrr = $current['start_mrr'];
        $mrrGrowth = $lastMrr > 0 ? round((($currentMrr - $lastMrr) / $lastMrr) * 100, 1) : 0;

        $arr = $currentMrr * 12;
        $activeCount = $current['end_count'];
        $arpu = $activeCount > 0 ? round($currentMrr / $activeCount) : 0;

        // Churn = comptes payants au 1er du mois qui ne paient plus
        $churnRate = $current['start_count'] > 0
            ? round(($current['churned_count'] / $current['start_count']) * 100, 2)
            : 0;

        // NRR = MRR actuel des comptes déjà clients au 1er / MRR au 1er
        $nrr = $lastMrr > 0
            ? round((($lastMrr + $current['expansion_mrr'] - $current['contraction_mrr'] - $current['churned_mrr']) / $lastMrr) * 100, 1)
            : 100;

        // LTV = ARPU / churn mensuel, sur la moyenne des 12 derniers mois
        // (le churn du seul mois en cours est trop bruité).
        $history = collect(range(11, 0))->map(function ($monthsAgo) use ($metrics) {
            $month = Carbon::now()->startOfMonth()->subMonths($monthsAgo);
            $m = $metrics->movements($month, PlatformMetrics::monthEnd($month));

            return ['month' => $month, 'm' => $m];
        });

        $avgChurn = $history->avg(fn ($h) => $h['m']['start_count'] > 0
            ? $h['m']['churned_count'] / $h['m']['start_count']
            : 0);
        $ltv = $avgChurn > 0 ? round($arpu / $avgChurn) : 0;

        $mrrHistory = $history->map(fn ($h) => [
            'month' => $h['month']->format('Y-m'),
            'mrr' => round($h['m']['end_mrr']),
            'new_mrr' => round($h['m']['new_mrr']),
            'expansion_mrr' => round($h['m']['expansion_mrr']),
            'churned_mrr' => round($h['m']['churned_mrr']),
            'count' => $h['m']['end_count'],
        ])->values();

        $churnHistory = $history->map(fn ($h) => [
            'month' => $h['month']->format('Y-m'),
            'churned' => $h['m']['churned_count'],
            'churn_rate' => $h['m']['start_count'] > 0
                ? round(($h['m']['churned_count'] / $h['m']['start_count']) * 100, 2)
                : 0,
        ])->values();

        // ── Encaissements réels (factures payées) sur 12 mois ─────────────
        $revenueHistory = collect(range(11, 0))->map(function ($monthsAgo) {
            $date = Carbon::now()->startOfMonth()->subMonths($monthsAgo);

            return [
                'month' => $date->format('Y-m'),
                'revenue' => round((float) SubscriptionInvoice::where('status', 'paid')
                    ->whereBetween('paid_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])
                    ->sum('total')),
            ];
        });

        // ── Répartition MRR par plan ───────────────────────────────────────
        $palette = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
        $mrrByPlan = $metrics->payingAt($now)
            ->groupBy('subscription_plan_id')
            ->values()
            ->map(fn ($subs, $i) => [
                'name' => $subs->first()->plan?->name ?? '—',
                'mrr' => round($subs->sum(fn ($s) => PlatformMetrics::monthlyAmount($s))),
                'count' => $subs->count(),
                'color' => $palette[$i % count($palette)],
            ]);

        // ── Comptes perdus sur les 30 derniers jours ───────────────────────
        $churnWindow = $metrics->movements($now->copy()->subDays(30), $now);
        $recentChurns = Subscription::with(['user', 'plan'])
            ->whereIn('user_id', $churnWindow['churned_user_ids'] ?: [0])
            ->where('amount', '>', 0)
            ->get()
            ->groupBy('user_id')
            ->map(function ($subs) {
                // La dernière souscription payante du compte, et sa date de fin réelle.
                $s = $subs->sortByDesc(fn ($x) => $x->cancelled_at ?? $x->expires_at)->first();

                return [
                    'user' => $s->user?->name ?? 'N/A',
                    'email' => $s->user?->email ?? '',
                    'plan' => $s->plan?->name ?? 'N/A',
                    'amount' => round(PlatformMetrics::monthlyAmount($s)),
                    'churned_at' => ($s->cancelled_at ?? $s->expires_at)?->toDateTimeString(),
                    'reason' => $s->cancelled_at ? 'cancelled' : 'expired',
                ];
            })
            ->sortByDesc('churned_at')
            ->take(10)
            ->values();

        // ── Abonnements à risque (expirent dans 30 jours) ──────────────────
        $atRisk = Subscription::with(['user', 'plan'])
            ->where('status', 'active')
            ->where('amount', '>', 0)
            ->whereBetween('expires_at', [$now, $now->copy()->addDays(30)])
            ->orderBy('expires_at')
            ->take(10)
            ->get()
            ->map(fn($s) => [
                'user'       => $s->user?->name ?? 'N/A',
                'email'      => $s->user?->email ?? '',
                'plan'       => $s->plan?->name ?? 'N/A',
                'expires_at' => $s->expires_at?->toDateTimeString(),
                'days_left'  => (int) floor($now->diffInDays($s->expires_at)),
                'amount'     => round(PlatformMetrics::monthlyAmount($s)),
            ]);

        return Inertia::render('PlatformAdmin/MRR', [
            'kpis' => [
                'mrr'           => round($currentMrr),
                'arr'           => round($arr),
                'arpu'          => $arpu,
                'mrr_growth'    => $mrrGrowth,
                'churn_rate'    => $churnRate,
                'churned_mrr'   => round($current['churned_mrr']),
                'new_mrr'       => round($current['new_mrr']),
                'expansion_mrr' => round($current['expansion_mrr']),
                'nrr'           => $nrr,
                'ltv'           => $ltv,
                'active_count'  => $activeCount,
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

        $query = User::where('role', 'super_admin')
            ->withCount([
                'shops',
                'shops as total_products_count' => function($query) {
                    $query->join('products', 'shops.id', '=', 'products.shop_id');
                }
            ]);

        // Recherche (insensible à la casse : ILIKE sous Postgres)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereLike('name', "%{$search}%")
                    ->orWhereLike('email', "%{$search}%")
                    ->orWhereLike('code_user', "%{$search}%");
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
            'created_at' => $user->created_at?->toDateTimeString(),
        ])->withQueryString();

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

        $query = Shop::with('user');

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereLike('name', "%{$search}%")
                    ->orWhereLike('slug', "%{$search}%")
                    ->orWhereHas('user', function($q) use ($search) {
                        $q->whereLike('name', "%{$search}%")
                            ->orWhereLike('email', "%{$search}%");
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
                'id' => $shop->user?->id,
                'name' => $shop->user?->name,
                'email' => $shop->user?->email,
                'code_user' => $shop->user?->code_user,
            ],
            'created_at' => $shop->created_at?->toDateTimeString(),
        ])->withQueryString();

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

        // Only an account owner can be suspended from here; the suspension then
        // covers their whole staff (User::isSuspended).
        if ($user->role !== 'super_admin') {
            return back()->with('error', __('platform.flash.only_owner_accounts'));
        }

        $user->update(['is_active' => !$user->is_active]);
        $this->audit($user->is_active ? 'account_reactivated' : 'account_suspended', $user);

        return back()->with('success', __($user->is_active ? 'platform.flash.account_reactivated' : 'platform.flash.account_suspended'));
    }

    /**
     * Toggle shop status.
     */
    public function toggleShopStatus(Shop $shop)
    {

        $shop->update(['is_active' => !$shop->is_active]);
        $this->audit($shop->is_active ? 'shop_reactivated' : 'shop_suspended', $shop);

        return back()->with('success', __($shop->is_active ? 'platform.flash.shop_reactivated' : 'platform.flash.shop_suspended'));
    }

    /**
     * Display all subscriptions.
     */
    public function subscriptions(Request $request): Response
    {

        $query = Subscription::query()
            ->with(['user', 'plan'])
            ->latest();

        // Search by user name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->whereLike('name', "%{$search}%")
                  ->orWhereLike('email', "%{$search}%");
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

        $subscription->cancel();
        $this->audit('subscription_cancelled', $subscription);

        return back()->with('success', __('platform.flash.subscription_cancelled'));
    }

    /**
     * Renew a subscription.
     */
    public function renewSubscription(Request $request, Subscription $subscription): RedirectResponse
    {

        $validated = $request->validate([
            'months' => 'required|integer|min:1|max:12',
        ]);

        $subscription->renew($validated['months']);
        $this->audit('subscription_renewed', $subscription, [
            'months' => $validated['months'],
            'expires_at' => $subscription->expires_at?->toDateTimeString(),
        ]);

        return back()->with('success', __('platform.flash.subscription_renewed', ['months' => $validated['months']]));
    }

    /**
     * Activate a pending subscription.
     */
    public function activateSubscription(Subscription $subscription): RedirectResponse
    {

        // Un seul abonnement actif à la fois : on annule les autres avant d'activer celui-ci.
        Subscription::where('user_id', $subscription->user_id)
            ->where('id', '!=', $subscription->id)
            ->where('status', 'active')
            ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        $months = $subscription->billing_cycle === 'yearly' ? 12 : 1;

        // A pending request may have sat for weeks: never activate it straight
        // into the past.
        $expiresAt = $subscription->expires_at && $subscription->expires_at->isFuture()
            ? $subscription->expires_at
            : now()->addMonths($months);

        $subscription->update([
            'status'       => 'active',
            'started_at'   => $subscription->started_at ?? now(),
            'expires_at'   => $expiresAt,
            'cancelled_at' => null,
        ]);
        $this->audit('subscription_activated', $subscription);

        // Mark related pending invoices as paid
        $subscription->invoices()->where('status', 'pending')->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $invoice = $subscription->invoices()->latest()->first();
        if ($invoice) {
            try {
                Mail::to($subscription->user->email)->send(
                    new SubscriptionInvoiceMail($subscription->user, $subscription->fresh(), $invoice)
                );
            } catch (\Throwable $e) {
                Log::error('SubscriptionInvoiceMail failed', ['user' => $subscription->user_id, 'error' => $e->getMessage()]);
            }
        }

        return back()->with('success', __('platform.flash.subscription_activated'));
    }

    /**
     * Update subscription dates.
     */
    public function updateSubscriptionDates(Request $request, Subscription $subscription): RedirectResponse
    {

        $validated = $request->validate([
            'started_at' => 'required|date',
            'expires_at' => 'nullable|date|after:started_at',
        ]);

        $subscription->update([
            'started_at' => $validated['started_at'],
            'expires_at' => $validated['expires_at'],
        ]);

        // Only an active/expired subscription follows its end date. A cancelled
        // or pending one keeps its status: changing dates must not resurrect
        // it, nor turn a cancellation into an expiry.
        if (in_array($subscription->status, ['active', 'expired'], true)) {
            $expired = $validated['expires_at'] && Carbon::parse($validated['expires_at'])->isPast();
            $subscription->update(['status' => $expired ? 'expired' : 'active']);
        }
        $this->audit('subscription_dates_updated', $subscription, $validated);

        return back()->with('success', __('platform.flash.subscription_dates_updated'));
    }

    /**
     * Display products of a specific shop for platform admin.
     */
    public function shopProducts(Request $request, Shop $shop): Response
    {

        $query = \App\Models\Product::with(['category', 'subcategory'])
            ->where('shop_id', $shop->id)
            ->orderBy('created_at', 'desc');

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereLike('name', "%{$search}%")
                    ->orWhereLike('sku', "%{$search}%")
                    ->orWhereLike('barcode', "%{$search}%");
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
            'created_at' => $product->created_at?->toDateTimeString(),
        ])->withQueryString();

        // This shop's categories only: categories are per shop.
        $categories = \App\Models\Category::where('shop_id', $shop->id)
            ->orderBy('order')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('PlatformAdmin/ShopProducts', [
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'owner' => [
                    'id' => $shop->user?->id,
                    'name' => $shop->user?->name,
                    'email' => $shop->user?->email,
                    'code_user' => $shop->user?->code_user,
                ],
            ],
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'status']),
        ]);
    }

    /**
     * Trace a platform-admin action in the application log.
     *
     * Not in activity_logs on purpose: that table is shown to the account
     * owners, and ActivityLogger never records admin_platforme actions.
     */
    private function audit(string $action, \Illuminate\Database\Eloquent\Model $subject, array $context = []): void
    {
        Log::info('platform_admin.' . $action, array_merge([
            'admin_id' => auth()->id(),
            'subject' => class_basename($subject),
            'subject_id' => $subject->getKey(),
        ], $context));
    }
}
