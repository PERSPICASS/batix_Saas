<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetPublicLocale
{
    /**
     * Set the application locale for public marketing routes (Home, Blog, etc.),
     * based on the URL the visitor is on (e.g. `/en/blog`) rather than a client-side toggle.
     */
    public function handle(Request $request, Closure $next, string $locale): Response
    {
        app()->setLocale($locale);

        return $next($request);
    }
}
