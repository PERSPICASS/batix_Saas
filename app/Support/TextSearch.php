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
 * Exposée sur toute requête par les macros `whereContains` / `orWhereContains` et
 * `whereMatchesWords` (AppServiceProvider), et utilisée par l'API v1 (SearchesText).
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

    /**
     * Chaque mot du terme doit se retrouver dans au moins une des colonnes, dans
     * n'importe quel ordre : « ciment 45 » trouve « Ciment CPJ 45 », et « pistolet
     * tolsen » trouve un produit dont la marque est Tolsen.
     *
     * @param  array<int, string>  $columns  Noms de colonnes internes, jamais saisis par l'utilisateur.
     */
    public static function matchesWords(Builder $query, array $columns, string $term): Builder
    {
        // Plafond : au-delà, l'utilisateur a saisi une phrase, pas une recherche, et
        // chaque mot ajoute un groupe de conditions pour rien.
        $words = array_slice(preg_split('/\s+/', trim($term), -1, PREG_SPLIT_NO_EMPTY) ?: [], 0, 6);

        if ($words === []) {
            return $query;
        }

        // Un seul groupe externe : un orWhere de l'appelant ne peut pas s'y mélanger.
        return $query->where(function (Builder $outer) use ($columns, $words) {
            foreach ($words as $word) {
                $outer->where(function (Builder $q) use ($columns, $word) {
                    foreach ($columns as $column) {
                        self::contains($q, $column, $word, 'or');
                    }
                });
            }
        });
    }
}
