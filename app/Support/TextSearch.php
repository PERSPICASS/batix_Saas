<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;

/**
 * Une recherche « contient » insensible à la casse et aux accents.
 *
 * Sur PostgreSQL (dev ET prod), `LIKE` distingue les majuscules : « ciment » ne trouvait
 * pas « Ciment CPJ 45 » dans les listes de l'app. `ILIKE` règle la casse, `translate()`
 * les accents (« electrique » trouve « électrique ») — du SQL standard, sans l'extension
 * `unaccent` ni migration. SQLite (la suite de tests) et MySQL ignorent déjà la casse avec
 * `LIKE`, et n'ont pas `translate()`.
 *
 * Exposée sur toute requête par les macros `whereContains` / `orWhereContains`
 * (AppServiceProvider), et utilisée par l'API v1 (SearchesText).
 */
class TextSearch
{
    /**
     * Caractères accentués et leur équivalent nu, position par position — les deux
     * chaînes doivent garder exactement le même nombre de caractères.
     */
    public const ACCENTED = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ';

    public const PLAIN = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN';

    /**
     * @param  string  $column  Nom de colonne interne, jamais saisi par l'utilisateur.
     */
    public static function contains(Builder $query, string $column, string $term, string $boolean = 'and'): Builder
    {
        // Driver lu sur la connexion de LA REQUÊTE : un modèle branché sur une autre
        // connexion se verrait sinon appliquer la grammaire d'une base qui n'est pas la sienne.
        if ($query->getConnection()->getDriverName() !== 'pgsql') {
            return $query->where($column, 'like', '%' . $term . '%', $boolean);
        }

        return $query->whereRaw(
            'translate(' . $query->getGrammar()->wrap($column) . ', ?, ?) ILIKE translate(?, ?, ?)',
            [self::ACCENTED, self::PLAIN, '%' . $term . '%', self::ACCENTED, self::PLAIN],
            $boolean,
        );
    }
}
