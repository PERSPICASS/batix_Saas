<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Sentry\Laravel\Facade as Sentry;

class SentryContext
{
    /**
     * Contexte utilisateur envoyé à Sentry avec chaque événement.
     *
     * `send_default_pii` (config/sentry.php, faux par défaut) empêche le SDK d'ajouter
     * lui-même des données personnelles — mais il ne filtre PAS ce que l'application
     * met explicitement dans le scope. Coder l'email en dur ici revenait donc à
     * contourner ce réglage, et à envoyer le nom et l'email de chaque utilisateur
     * authentifié à Sentry (déclaré comme sous-traitant pour des données techniques
     * pseudonymisées uniquement, cf. i18n/subprocessors.ts).
     *
     * `id` et `code_user` suffisent à retrouver un utilisateur en base depuis un
     * événement ; l'email ne part que si le réglage l'autorise explicitement.
     */
    public static function userContext(User $user): array
    {
        $context = [
            'id' => $user->id,
            'code_user' => $user->code_user,
        ];

        if (config('sentry.send_default_pii')) {
            $context['email'] = $user->email;
            $context['username'] = $user->name;
        }

        return $context;
    }

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();

            Sentry::configureScope(function ($scope) use ($user) {
                $scope->setUser(self::userContext($user));

                if ($user->shop_id) {
                    $scope->setTag('shop_id', $user->shop_id);
                }
            });
        }

        return $next($request);
    }
}
