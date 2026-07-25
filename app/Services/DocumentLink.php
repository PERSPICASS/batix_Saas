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

    private static function sign(string $route, array $parameters): string
    {
        return URL::temporarySignedRoute(
            $route,
            now()->addDays(self::LIFETIME_DAYS),
            $parameters
        );
    }
}
