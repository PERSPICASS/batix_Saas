<?php

namespace App\Traits;

use App\Models\Product;
use App\Models\Shop;

/**
 * D'où vient le taux de taxe d'une ligne.
 *
 * L'ordre reprend celui qu'applique déjà SaleCreationService au comptoir : le taux
 * propre au produit, sinon le taux configuré de la boutique (`shops.default_tax_rate`,
 * réglable dans les Réglages et déjà partagé au frontend), sinon zéro.
 *
 * Les devis et les factures récurrentes posaient un 18 en dur, qui ignorait les deux :
 * une boutique marocaine à 20 % ou une quincaillerie non assujettie à 0 % se voyait
 * quand même appliquer 18 %. Sur un devis converti en facture, ce taux devenait celui
 * d'une pièce comptable.
 */
trait ResolvesTaxRate
{
    protected function taxRateFor(?int $productId, ?Shop $shop): float
    {
        $productRate = $productId
            ? Product::whereKey($productId)->value('tax_rate')
            : null;

        // Un produit explicitement à 0 % est une réponse — il est exonéré — pas une
        // absence de réponse : seul NULL fait descendre d'un cran. C'est ce que rend
        // possible le passage de products.tax_rate en nullable ; tant que la colonne était
        // NOT NULL DEFAULT 0, le 0 des produits jamais configurés masquait le réglage de
        // la boutique. Même règle que Product::effectiveTaxRate(), côté modèle.
        if ($productRate !== null) {
            return (float) $productRate;
        }

        return (float) ($shop?->default_tax_rate ?? 0);
    }

    /**
     * Taxe totale d'un jeu de lignes, chacune à son propre taux.
     *
     * Un taux global appliqué au sous-total ne tient plus dès que deux lignes n'ont pas
     * le même taux — ce qui devient la règle une fois le taux pris sur le produit.
     *
     * @param  array<int, array{product_id?: int|null, quantity: int|string, unit_price: int|float|string}>  $items
     */
    protected function taxAmountFor(array $items, ?Shop $shop): float
    {
        $tax = 0.0;

        foreach ($items as $item) {
            $lineTotal = (float) $item['quantity'] * (float) $item['unit_price'];
            $tax += $lineTotal * $this->taxRateFor($item['product_id'] ?? null, $shop) / 100;
        }

        return round($tax, 2);
    }
}
