<?php

namespace App\Casts;

use App\Support\Unit;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Une quantité ou un niveau de stock : numeric(12,3) en base, float en PHP.
 *
 * `decimal:3` rendrait une chaîne (« 2.500 »), que l'arithmétique et les comparaisons
 * du stock manipuleraient mal ; un float arrondi à 3 décimales reste exact à ce niveau.
 */
class Quantity implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?float
    {
        return $value === null ? null : Unit::round($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?float
    {
        return $value === null || $value === '' ? null : Unit::round($value);
    }
}
