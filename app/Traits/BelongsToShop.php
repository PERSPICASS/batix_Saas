<?php

namespace App\Traits;

use Illuminate\Routing\Middleware\ValidateSignature;
use Illuminate\Support\Facades\Auth;

/**
 * Restreint la liaison de route ({sale}, {invoice}…) aux boutiques accessibles par
 * l'utilisateur connecté : l'enregistrement d'un autre compte répond 404, comme
 * s'il n'existait pas.
 *
 * Chaque action vérifiait déjà `accessibleShopsQuery()` à la main — près de
 * 90 fois. Ce n'est pas la vérification présente qui posait problème, c'est la
 * prochaine qu'on oublierait : celle-ci s'applique d'office à toute route.
 *
 * Deux exceptions, voulues :
 * - aucun utilisateur connecté (console, webhooks) : rien à restreindre ;
 * - une route signée (ticket WhatsApp, devis et facture publics) : la signature
 *   fait foi, et un client qui a lui-même un compte BATIX doit pouvoir ouvrir le
 *   ticket qu'une autre boutique lui a envoyé.
 */
trait BelongsToShop
{
    public function resolveRouteBinding($value, $field = null)
    {
        $query = $this->resolveRouteBindingQuery($this, $value, $field);
        $user = Auth::user();

        if ($user && $user->role !== 'admin_platforme' && !self::onSignedRoute()) {
            $query->whereIn($this->qualifyColumn('shop_id'), $user->accessibleShopsQuery()->select('shops.id'));
        }

        return $query->first();
    }

    private static function onSignedRoute(): bool
    {
        $route = request()->route();

        if (!$route) {
            return false;
        }

        foreach ($route->gatherMiddleware() as $middleware) {
            if (is_string($middleware)
                && (str_starts_with($middleware, 'signed') || str_starts_with($middleware, ValidateSignature::class))) {
                return true;
            }
        }

        return false;
    }
}
