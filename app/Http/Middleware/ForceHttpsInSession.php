<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttpsInSession
{
    /**
     * Handle an incoming request.
     * Force HTTPS dans les URLs stockées en session
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Forcer HTTPS pour toutes les URLs en production ou si derrière un proxy HTTPS
        if ($request->server('HTTP_X_FORWARDED_PROTO') === 'https' || app()->environment('production')) {
            // Corriger l'URL intended si elle existe et utilise HTTP
            $intended = session('url.intended');
            if ($intended && str_starts_with($intended, 'http://')) {
                $httpsUrl = str_replace('http://', 'https://', $intended);
                session(['url.intended' => $httpsUrl]);
            }
            
            // Corriger d'autres URLs potentielles en session
            $returnUrl = session('lock_screen_return_url');
            if ($returnUrl && str_starts_with($returnUrl, 'http://')) {
                $httpsUrl = str_replace('http://', 'https://', $returnUrl);
                session(['lock_screen_return_url' => $httpsUrl]);
            }
        }

        return $next($request);
    }
}
