<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        // Pages publiques : partager le strict minimum
        if (!$user) {
            return [
                ...parent::share($request),
                'auth' => ['user' => null, 'code_user' => null],
                'locale' => fn () => app()->getLocale(),
                'flash' => [
                    'success' => fn () => $request->session()->get('success'),
                    'error'   => fn () => $request->session()->get('error'),
                    'warning' => fn () => $request->session()->get('warning'),
                    'info'    => fn () => $request->session()->get('info'),
                ],
                'csrf_token' => csrf_token(),
                'whatsapp_number' => config('app.whatsapp_number'),
                // Base absolue des URL du balisage SEO (données structurées, images OG) :
                // partagée plutôt que repassée par chaque contrôleur de page publique.
                'appUrl' => rtrim(config('app.url'), '/'),
                'ziggy' => fn () => [...(new \Tighten\Ziggy\Ziggy)->toArray(), 'location' => $request->url()],
            ];
        }

        // ── Calcul paresseux (lazy) du code_user propriétaire ──────────────
        $accountCode = null;
        if ($user->role === 'super_admin') {
            $accountCode = $user->code_user;
        } else {
            $shopId = $user->shop_id;
            if ($shopId) {
                // Une seule requête SQL : on récupère juste user_id du shop
                $ownerId = \App\Models\Shop::where('id', $shopId)->value('user_id');
                if ($ownerId) {
                    $accountCode = \App\Models\User::where('id', $ownerId)->value('code_user');
                }
            }
        }

        // ── Boutique active (calculée une seule fois) ──────────────────────
        $shop = current_shop();
        $activeShopData = $shop ? [
            'id'   => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
        ] : null;

        // ── Permissions : uniquement les colonnes utiles ───────────────────
        $userForAuth = [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'code_user'  => $user->code_user,
            'shop_id'    => $user->shop_id,
            'avatar'     => $user->avatar ?? null,
            'shop'       => $user->shop ? [
                'id'      => $user->shop->id,
                'name'    => $user->shop->name,
                'slug'    => $user->shop->slug,
                'address' => $user->shop->address ?? null,
                'city'    => $user->shop->city ?? null,
                'phone'   => $user->shop->phone ?? null,
            ] : null,
            // Permissions : tableau d'objets (format attendu par Profile/Edit et AuthenticatedLayout)
            'permissions' => $user->role === 'admin_platforme'
                ? []
                : $user->permissions()
                    ->select('id', 'module', 'can_view', 'can_create', 'can_edit', 'can_delete')
                    ->get()
                    ->map(fn($p) => [
                        'id'         => $p->id,
                        'module'     => $p->module,
                        'can_view'   => (bool) $p->can_view,
                        'can_create' => (bool) $p->can_create,
                        'can_edit'   => (bool) $p->can_edit,
                        'can_delete' => (bool) $p->can_delete,
                    ])
                    ->values()
                    ->toArray(),
        ];

        // ── Boutiques accessibles : colonnes minimales ─────────────────────
        $shops = $user->role !== 'admin_platforme'
            ? $user->accessibleShops()
                ->map(fn($s) => [
                    'id'        => $s->id,
                    'name'      => $s->name,
                    'slug'      => $s->slug,
                    'is_active' => $s->is_active ?? true,
                ])
                ->values()
                ->toArray()
            : [];

        // ── Subscription : lazy closure (calculée seulement si la page en a besoin) ──
        $subscription = $user->role === 'super_admin'
            ? fn () => $user->getSubscriptionLimits()
            : null;

        // ── Stock bas : compte produits sous seuil d'alerte ───────────────
        $lowStockCount = ($user->role !== 'admin_platforme' && $shop)
            ? fn () => \App\Models\Product::where('shop_id', $shop->id)
                ->where('track_stock', true)
                ->whereNotNull('min_stock_alert')
                ->where('min_stock_alert', '>', 0)
                ->whereColumn('stock_quantity', '<=', 'min_stock_alert')
                ->where('is_active', true)
                ->count()
            : null;

        return [
            ...parent::share($request),
            'auth' => [
                'user'      => $userForAuth,
                'code_user' => $user->code_user,
            ],
            'locale' => fn () => app()->getLocale(),
            'subscription'  => $subscription,
            'lowStockCount' => $lowStockCount,
            'shops'         => $shops,
            'activeShop'    => $activeShopData,
            'currentShop'   => $activeShopData, // alias conservé pour compatibilité
            'routeParams'   => [
                'code_user' => $accountCode,
                'shop_slug' => shop_slug(),
            ],
            'shopSettings' => $shop ? [
                'currency'         => $shop->currency,
                'currency_symbol'  => get_currency_symbol($shop->currency),
                'default_tax_rate' => $shop->default_tax_rate,
                'invoice_prefix'   => $shop->invoice_prefix,
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info'    => fn () => $request->session()->get('info'),
                // Uniquement présent juste après la création d'un token API — affiché une seule fois,
                // jamais persisté en clair (Sanctum ne stocke qu'un hash).
                'plainTextToken' => fn () => $request->session()->get('plainTextToken'),
            ],
            'csrf_token' => csrf_token(),
            'whatsapp_number' => config('app.whatsapp_number'),
            'appUrl' => rtrim(config('app.url'), '/'),
            'ziggy' => fn () => [...(new \Tighten\Ziggy\Ziggy)->toArray(), 'location' => $request->url()],
        ];
    }
}
