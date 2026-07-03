<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'admin_platforme') {
            abort(403, "Vous n'avez pas l'autorisation d'accéder à l'administration plateforme.");
        }

        return $next($request);
    }
}
