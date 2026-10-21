<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pour un visiteur non connecté, la langue de l'interface est choisie côté navigateur
 * (localStorage) : le serveur ne la connaissait pas et répondait toujours en français,
 * y compris les erreurs de connexion et de validation. Le front la recopie dans le
 * cookie `locale`, lu ici. Un utilisateur connecté garde la langue de son compte
 * (ValidateAccountAccess), et les pages marketing celle de leur URL (SetPublicLocale),
 * qui s'appliquent toutes deux après ce middleware.
 */
class SetGuestLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale');

        if ($request->user() === null && in_array($locale, ['fr', 'en'], true)) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
