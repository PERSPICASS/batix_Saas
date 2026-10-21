<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionLimits
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $limitType): Response
    {
        $user = $request->user();

        // Admin platforme is not subject to limits
        if ($user && $user->role === 'admin_platforme') {
            return $next($request);
        }

        // Only check limits for super_admin
        if (!$user || $user->role !== 'super_admin') {
            return $next($request);
        }

        // Check if user has an active subscription
        $subscription = $user->activeSubscription();
        
        if (!$subscription) {
            return redirect()
                ->back()
                ->with('error', 'Vous devez avoir un abonnement actif pour effectuer cette action.');
        }

        // Check specific limit type
        switch ($limitType) {
            case 'shop':
                if (!$user->canCreateShop()) {
                    $limits = $user->getSubscriptionLimits();
                    return redirect()
                        ->back()
                        ->with('error', "Limite de boutiques atteinte. Votre plan \"{$limits['plan_name']}\" autorise {$limits['max_shops']} boutique(s). Veuillez mettre à niveau votre abonnement.");
                }
                break;

            case 'user':
                if (!$user->canCreateUser()) {
                    $limits = $user->getSubscriptionLimits();
                    return redirect()
                        ->back()
                        ->with('error', "Limite d'utilisateurs atteinte. Votre plan \"{$limits['plan_name']}\" autorise {$limits['max_users']} utilisateur(s). Veuillez mettre à niveau votre abonnement.");
                }
                break;

            default:
                // Unknown limit type, just proceed
                break;
        }

        return $next($request);
    }
}
