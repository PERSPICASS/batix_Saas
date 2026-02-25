<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $shop = current_shop();
        $user = $request->user();
        
        // Déterminer le code_user du compte (propriétaire)
        $accountCode = null;
        if ($user) {
            if ($user->role === 'super_admin') {
                $accountCode = $user->code_user;
            } else {
                // Trouver le propriétaire via la boutique
                $userShop = $user->shop; // Relation belongsTo
                
                if (!$userShop && $user->shop_id) {
                    // Charger explicitement si pas déjà chargé
                    $userShop = \App\Models\Shop::find($user->shop_id);
                }
                
                if ($userShop) {
                    $owner = \App\Models\User::find($userShop->user_id);
                    $accountCode = $owner ? $owner->code_user : null;
                }
            }
        }
        
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? $user->load(['shop', 'permissions']) : null,
                'code_user' => $user?->code_user,
            ],
            'shops' => $user ? $user->accessibleShops()->map(function ($shop) {
                return [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                    'is_active' => $shop->is_active ?? true,
                ];
            })->values()->toArray() : [],
            'activeShop' => current_shop() ? [
                'id' => current_shop()->id,
                'name' => current_shop()->name,
                'slug' => current_shop()->slug,
            ] : null,
            'currentShop' => current_shop() ? [
                'id' => current_shop()->id,
                'name' => current_shop()->name,
                'slug' => current_shop()->slug,
            ] : null,
            'routeParams' => [
                'code_user' => $accountCode, // Code du propriétaire du compte
                'shop_slug' => shop_slug(),
            ],
            'shopSettings' => $shop ? [
                'currency' => $shop->currency,
                'currency_symbol' => get_currency_symbol($shop->currency),
                'default_tax_rate' => $shop->default_tax_rate,
                'invoice_prefix' => $shop->invoice_prefix,
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
        ];
    }
}
