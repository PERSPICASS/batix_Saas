<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Sale;
use Illuminate\Support\Facades\URL;

/**
 * Fabrique les liens publics signés vers une pièce commerciale.
 *
 * Un seul endroit décide de la durée de validité : elle se lit d'un coup d'œil et se
 * change d'une ligne, plutôt que d'être recopiée à chaque appel.
 */
class DocumentLink
{
    /**
     * Durée de validité d'un lien partagé, en jours.
     *
     * Compromis assumé. Trop court, le client perd son exemplaire : le lien envoyé par
     * WhatsApp EST sa copie, puisqu'un lien wa.me ne transporte pas de fichier. Trop long,
     * une adresse qui fuite reste ouverte indéfiniment sur le web. Trois mois couvrent
     * largement un retour marchandise ou une réclamation, après quoi le commerçant peut
     * toujours renvoyer un lien frais.
     */
    public const LIFETIME_DAYS = 90;

    public static function forSale(Sale $sale): string
    {
        return self::sign('public.ticket', ['sale' => $sale->id]);
    }

    public static function forInvoice(Invoice $invoice): string
    {
        return self::sign('public.invoice', ['invoice' => $invoice->id]);
    }

    public static function forQuote(Quote $quote): string
    {
        return self::sign('public.quote', ['quote' => $quote->id]);
    }

    /**
     * La signature ne porte que sur le chemin et la requête, jamais sur le schéma ni sur
     * l'hôte — d'où `absolute: false`, à lire avec le `signed:relative` des routes.
     *
     * Une signature absolue produisait un 403 sur chaque lien en production. Le nginx du
     * conteneur écoute en HTTP et ne transmet rien du schéma à PHP : aucun
     * `fastcgi_param HTTPS`, aucune reprise de `X-Forwarded-Proto`. Laravel voit donc une
     * requête HTTP, tandis qu'AppServiceProvider force `https` à la génération. L'URL
     * signée et l'URL vérifiée ne pouvaient pas coïncider.
     *
     * Le relatif supprime la dépendance : le lien reste valable quel que soit le schéma
     * ou l'hôte par lequel le client arrive. Ce qu'on perd — l'ancrage sur le domaine —
     * ne protégeait de rien ici, l'application ne répondant que sur le sien.
     */
    private static function sign(string $route, array $parameters): string
    {
        $relative = URL::temporarySignedRoute(
            $route,
            now()->addDays(self::LIFETIME_DAYS),
            $parameters,
            absolute: false
        );

        return rtrim(config('app.url'), '/') . $relative;
    }
}
