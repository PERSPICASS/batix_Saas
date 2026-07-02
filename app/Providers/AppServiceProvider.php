<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Forcer HTTPS en production
        if ($this->app->environment('production') || request()->server('HTTP_X_FORWARDED_PROTO') === 'https') {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        // Limite par défaut du groupe de middleware "api" (routes/api.php) : 60 req/min,
        // par token si authentifié via Sanctum, sinon par IP.
        RateLimiter::for('api', function ($request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Redirect pour les utilisateurs déjà connectés (middleware guest)
        // Évite l'erreur "Missing parameter: code_user" sur route('dashboard')
        RedirectIfAuthenticated::redirectUsing(function ($request) {
            $user = Auth::user();
            if (!$user) return '/';
            if (!$user->hasVerifiedEmail()) {
                return route('register'); // → Register étape 2 (OTP)
            }
            if ($user->code_user) {
                return route('dashboard', ['code_user' => $user->code_user]);
            }
            return route('register'); // → Register étape 3 (boutique inline)
        });

        // Partager les boutiques de l'utilisateur avec toutes les vues Inertia
        Inertia::share([
            'shops' => function () {
                if (Auth::check()) {
                    return Auth::user()->shops()->get()->map(function ($shop) {
                        return [
                            'id' => $shop->id,
                            'name' => $shop->name,
                            'slug' => $shop->slug,
                            'is_active' => $shop->is_active,
                        ];
                    });
                }
                return [];
            },
            'activeShop' => function () {
                return get_active_shop();
            },
        ]);
    }
}
