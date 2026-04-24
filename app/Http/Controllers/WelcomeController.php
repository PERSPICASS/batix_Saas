<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    /**
     * Display the welcome/landing page with subscription plans.
     */
    public function index(): Response
    {
        // Récupérer les plans actifs triés par prix
        $plans = SubscriptionPlan::where('is_active', true)
            ->orderBy('price', 'asc')
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'formatted_price' => $plan->formatted_price,
                    'price_eur' => $plan->price_eur,
                    'price_fcfa' => $plan->price_fcfa,
                    'max_shops' => $plan->max_shops,
                    'max_users' => $plan->max_users,
                    'max_products' => $plan->max_products,
                    'max_depots' => $plan->max_depots,
                    'features' => $plan->features,
                    'shop_limit_text' => $plan->shop_limit_text,
                    'has_unlimited_shops' => $plan->hasUnlimitedShops(),
                    'has_unlimited_users' => $plan->hasUnlimitedUsers(),
                    'has_unlimited_products' => $plan->hasUnlimitedProducts(),
                    'has_unlimited_depots' => $plan->hasUnlimitedDepots(),
                ];
            });

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
            'subscriptionPlans' => $plans,
            'appUrl' => rtrim(config('app.url'), '/'),
        ]);
    }
}
