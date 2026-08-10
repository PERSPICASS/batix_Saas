<?php

namespace App\Http\Middleware;

use App\Models\Subscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Passe le compte en LECTURE SEULE quand son abonnement est réellement terminé.
 *
 * Avant ce middleware, l'expiration ne coupait que quatre actions (créer une boutique,
 * un utilisateur, un produit, un dépôt), chacune vérifiée dans son contrôleur. Tout le
 * reste du SaaS — ventes, factures, devis, dépenses, achats, inventaires, mouvements de
 * stock — restait pleinement utilisable indéfiniment après la fin de l'essai.
 *
 * « Réellement terminé » veut dire : plus aucun abonnement rendu par
 * `activeSubscription()`, qui englobe déjà la période de grâce de 14 jours
 * (User::SUBSCRIPTION_GRACE_PERIOD_DAYS). Un compte échu depuis moins de 14 jours n'est
 * donc pas touché ici.
 *
 * La lecture reste entière : toutes les requêtes GET/HEAD passent, donc la consultation
 * et les exports (qui sont des GET) continuent de fonctionner. Seules les écritures sont
 * refusées.
 */
class EnforceSubscriptionReadOnly
{
    /**
     * Écritures qui doivent rester possibles même en lecture seule : sans elles, le
     * compte serait enfermé. Les routes de paiement, de connexion, de mot de passe et de
     * double authentification ne figurent pas ici car elles vivent hors du groupe
     * `{code_user}` auquel ce middleware est attaché — elles ne sont jamais bloquées.
     */
    private const ALWAYS_ALLOWED = [
        'profile.update',   // corriger ses coordonnées reste de l'administration de compte
        'profile.destroy',  // droit de fermer son compte : ne doit jamais dépendre d'un paiement
        'locale.update',    // changer la langue de l'interface n'écrit aucune donnée métier
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->role === 'admin_platforme') {
            return $next($request);
        }

        // Lecture seule : tout ce qui ne modifie rien passe.
        if ($request->isMethodSafe()) {
            return $next($request);
        }

        // `activeSubscription()` remonte au propriétaire du compte : les employés d'un
        // compte expiré sont donc logés à la même enseigne, sans traitement particulier.
        if ($user->activeSubscription()) {
            return $next($request);
        }

        // Un compte qui n'a JAMAIS eu d'abonnement n'est pas un compte expiré : c'est un
        // compte qui n'a pas fini de s'inscrire. Le plan gratuit n'est créé qu'à la
        // première boutique (ShopController::store) — bloquer ici enfermerait tout
        // nouvel inscrit dehors, incapable de créer cette première boutique. Les quotas
        // (`canCreateShop`, `canCreateProduct`...) couvrent déjà ce cas en échouant
        // fermé de leur côté.
        $latest = $this->latestSubscription($user);

        if (!$latest) {
            return $next($request);
        }

        if (in_array($request->route()?->getName(), self::ALWAYS_ALLOWED, true)) {
            return $next($request);
        }

        $message = $this->message($latest);

        if ($request->expectsJson()) {
            return response()->json(['message' => $message], 403);
        }

        return back()->with('error', $message);
    }

    private function latestSubscription($user): ?Subscription
    {
        $ownerId = $user->ownerId();

        if (!$ownerId) {
            return null;
        }

        return Subscription::where('user_id', $ownerId)->latest('started_at')->first();
    }

    private function message(Subscription $subscription): string
    {
        $expiredAt = $subscription->expires_at;

        $when = $expiredAt ? ' le ' . $expiredAt->translatedFormat('j F Y') : '';

        return "Votre abonnement a expiré{$when}. Votre compte est en lecture seule : "
            . 'vous pouvez consulter et exporter vos données, mais plus les modifier. '
            . 'Renouvelez votre abonnement pour réactiver la saisie.';
    }
}
