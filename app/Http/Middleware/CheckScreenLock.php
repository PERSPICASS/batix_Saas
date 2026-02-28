<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckScreenLock
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Si l'utilisateur est authentifié et l'écran est verrouillé
        if (Auth::check() && session('screen_locked')) {
            // Ne pas rediriger si on est déjà sur la page de verrouillage ou logout
            $currentRoute = $request->route()?->getName();
            if (!in_array($currentRoute, ['lock-screen.show', 'lock-screen.unlock', 'logout'])) {
                return redirect()->route('lock-screen.show');
            }
        }

        return $next($request);
    }
}
