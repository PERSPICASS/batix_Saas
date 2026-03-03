<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
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
