<?php

namespace App\Support;

/**
 * Une remise accordée sur l'ensemble d'un document réduit la base imposable.
 *
 * Les factures et les ventes retranchaient la remise du total TTC, donc *après* la TVA :
 * une remise de 10 000 diminuait bien le total de 10 000, mais la taxe restait calculée
 * sur la base non remisée. La TVA déclarée était donc surévaluée dès qu'une remise était
 * appliquée. (Les remises par ligne, elles, étaient déjà correctes — voir
 * InvoiceItem::saving et PurchaseItem::saving, qui déduisent avant de taxer.)
 *
 * La remise est répartie au prorata de la base : chaque taux voit sa propre base réduite
 * dans la même proportion. C'est ce qui permet à un document portant deux taux de rester
 * juste — appliquer la remise à un seul taux fausserait la ventilation.
 */
class GlobalDiscount
{
    /**
     * Part de la base HT qui subsiste après la remise.
     *
     * Multiplier la taxe brute par ce rapport revient à taxer la base remisée, et le
     * résultat reste exact quand plusieurs taux coexistent.
     */
    public static function ratio(float $baseHt, ?float $discount): float
    {
        if ($baseHt <= 0) {
            return 0.0;
        }

        return ($baseHt - self::effective($baseHt, $discount)) / $baseHt;
    }

    /**
     * Remise réellement applicable.
     *
     * Bornée à la base : rien ne validait qu'une remise ne dépasse pas le montant du
     * document, et une remise supérieure produisait un total négatif — donc une taxe
     * négative une fois la base réduite.
     */
    public static function effective(float $baseHt, ?float $discount): float
    {
        return min(max((float) $discount, 0.0), max($baseHt, 0.0));
    }
}
