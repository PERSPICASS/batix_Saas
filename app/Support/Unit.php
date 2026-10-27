<?php

namespace App\Support;

/**
 * Unité de vente d'un produit, et donc la forme de ses quantités.
 *
 * Une quincaillerie vend du ciment au kilo et du ruban au mètre : seules ces unités
 * « divisibles » acceptent une quantité décimale (2,5 kg). Une pièce, un sac ou une
 * boîte reste un entier — vendre 0,5 marteau est une faute de frappe, pas une vente.
 *
 * `products.unit` a longtemps été du texte libre (« Pièce », « Kg », « M² » à l'import,
 * « piece » au formulaire) : normalize() ramène ces variantes à un code, et une valeur
 * inconnue est conservée telle quelle et traitée comme non divisible.
 */
final class Unit
{
    public const PRECISION = 3;

    /** Code => symbole affiché après une quantité ('' : on n'affiche rien). */
    private const SYMBOLS = [
        'piece' => '',
        'box' => '',
        'bag' => '',
        'pack' => '',
        'kg' => 'kg',
        'g' => 'g',
        'l' => 'L',
        'ml' => 'mL',
        'm' => 'm',
        'm2' => 'm²',
        'm3' => 'm³',
    ];

    /** Le nom d'une unité qui se compte, là où un document l'écrit en toutes lettres. */
    private const NAMES = ['piece' => 'Pièce', 'box' => 'Boîte', 'bag' => 'Sac', 'pack' => 'Pack'];

    private const DIVISIBLE = ['kg', 'g', 'l', 'ml', 'm', 'm2', 'm3'];

    private const ALIASES = [
        'piece' => 'piece', 'pièce' => 'piece', 'pieces' => 'piece', 'pièces' => 'piece',
        'unité' => 'piece', 'unite' => 'piece', 'unit' => 'piece', 'u' => 'piece', 'pc' => 'piece', 'pce' => 'piece',
        'box' => 'box', 'boîte' => 'box', 'boite' => 'box',
        'bag' => 'bag', 'sac' => 'bag',
        'pack' => 'pack', 'paquet' => 'pack', 'lot' => 'pack',
        'kg' => 'kg', 'kilo' => 'kg', 'kilogramme' => 'kg',
        'g' => 'g', 'gramme' => 'g',
        'l' => 'l', 'litre' => 'l', 'liter' => 'l',
        'ml' => 'ml', 'millilitre' => 'ml',
        'm' => 'm', 'mètre' => 'm', 'metre' => 'm', 'meter' => 'm',
        'm2' => 'm2', 'm²' => 'm2', 'mètre carré' => 'm2', 'metre carre' => 'm2',
        'm3' => 'm3', 'm³' => 'm3', 'mètre cube' => 'm3', 'metre cube' => 'm3',
    ];

    /** @return list<string> */
    public static function codes(): array
    {
        return array_keys(self::SYMBOLS);
    }

    public static function normalize(?string $unit): string
    {
        $raw = trim((string) $unit);

        if ($raw === '') {
            return 'piece';
        }

        return self::ALIASES[mb_strtolower($raw)] ?? $raw;
    }

    public static function isDivisible(?string $unit): bool
    {
        return in_array(self::normalize($unit), self::DIVISIBLE, true);
    }

    /** « Pièce », « kg », « m² » ; une unité inconnue est rendue telle quelle. */
    public static function label(?string $unit): string
    {
        $code = self::normalize($unit);

        return self::NAMES[$code] ?? (self::SYMBOLS[$code] ?? $code);
    }

    public static function round(float|int|string|null $quantity): float
    {
        return round((float) $quantity, self::PRECISION);
    }

    /**
     * « 2,5 kg », « 12 » — pour les PDF et les messages. Les zéros inutiles disparaissent :
     * une pièce n'a jamais de décimales et 2,500 kg s'écrit 2,5 kg.
     */
    public static function format(float|int|string|null $quantity, ?string $unit = null): string
    {
        $number = rtrim(rtrim(number_format(self::round($quantity), self::PRECISION, ',', ' '), '0'), ',');
        $symbol = self::SYMBOLS[self::normalize($unit)] ?? '';

        return $symbol === '' ? $number : "{$number} {$symbol}";
    }
}
