<?php

namespace App\Traits;

trait GeneratesBarcode
{
    /**
     * Génère un code-barres EAN-13 interne avec catégorie, ID produit et prix encodés.
     * Préfixe "2" = usage interne magasin (norme EAN).
     */
    protected function generateBarcodeWithPrice(int $productId, ?int $categoryId, float $price): string
    {
        $prefix       = '2';
        $categoryPart = str_pad((string)(($categoryId ?? 0) % 100), 2, '0', STR_PAD_LEFT);
        $productPart  = str_pad((string)($productId % 100000), 5, '0', STR_PAD_LEFT);
        $priceHundreds = (int) min(floor($price / 100), 9999);
        $pricePart    = str_pad((string)$priceHundreds, 4, '0', STR_PAD_LEFT);

        $barcode12 = $prefix . $categoryPart . $productPart . $pricePart;

        return $barcode12 . $this->calculateEAN13Checksum($barcode12);
    }

    /**
     * Calcule le chiffre de contrôle EAN-13.
     */
    protected function calculateEAN13Checksum(string $barcode12): int
    {
        if (strlen($barcode12) !== 12 || !ctype_digit($barcode12)) {
            throw new \InvalidArgumentException('Le code-barres doit contenir exactement 12 chiffres.');
        }

        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int) $barcode12[$i];
            $sum  += ($i % 2 === 0) ? $digit : $digit * 3;
        }

        return (10 - ($sum % 10)) % 10;
    }
}
