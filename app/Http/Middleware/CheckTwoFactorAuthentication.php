<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTwoFactorAuthentication
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        // Si pas d'utilisateur authentifié, laisser passer
        if (!$user) {
            return $next($request);
        }

        // Si 2FA activé mais pas encore vérifié en session
        if ($user->two_factor_enabled && !session('2fa_verified')) {
            // Laisser passer pour certaines routes
            if ($request->routeIs('logout', 'two-factor.*')) {
                return $next($request);
            }

            // Rediriger vers la page de vérification 2FA
            return redirect()->route('two-factor.verify');
        }

        return $next($request);
    }
}
