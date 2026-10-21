<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Recherche texte tolérante, pour les endpoints v1 consommés par l'assistant IA et les
 * intégrations tierces.
 *
 * Trois pièges, tous rencontrés en conditions réelles sur un même parcours de devis :
 *
 * 1. LA CASSE — sur PostgreSQL (dev ET prod), `LIKE` distingue les majuscules :
 *    « pistolet » ne trouvait pas « Pistolet à peinture électrique 600W ».
 * 2. LES ACCENTS — `ILIKE` corrige la casse mais pas les accents : « electrique »
 *    ne trouvait toujours pas « électrique ». Personne ne tape les accents dans une
 *    barre de recherche.
 * 3. LE FORMAT DES NUMÉROS — les téléphones sont stockés en texte libre, sans
 *    normalisation côté serveur : « +2250987654322 » ne trouve pas « +225 09 87 65 43 22 ».
 *
 * Le désaccentuage passe par `translate()` plutôt que par l'extension `unaccent` :
 * `translate` est du SQL standard, sans DDL ni migration, donc sans risque de casser un
 * déploiement sur une base dont on ne maîtrise ni la version ni les privilèges.
 *
 * Rien de tout cela n'est vérifiable par la suite de tests, qui tourne sur SQLite : son
 * `LIKE` ignore déjà la casse, et un test de résultat y passerait au vert en couvrant
 * précisément le bug. Les tests portent donc sur le SQL produit.
 */
trait SearchesText
{
    /**
     * Caractères accentués et leur équivalent nu, position par position — les deux
     * chaînes doivent garder exactement le même nombre de caractères.
     */
    private const ACCENTED = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ';

    private const PLAIN = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN';

    /**
     * Driver lu sur la connexion de LA REQUÊTE, pas sur la connexion par défaut : un
     * modèle branché sur une autre connexion se verrait sinon appliquer la grammaire
     * d'une base qui n'est pas la sienne.
     */
    private function isPostgres(Builder $query): bool
    {
        return $query->getConnection()->getDriverName() === 'pgsql';
    }

    private function wrapColumn(Builder $query, string $column): string
    {
        return $query->getConnection()->getQueryGrammar()->wrap($column);
    }

    /**
     * Ajoute une recherche « contient », insensible à la casse et aux accents, sur un
     * ensemble de colonnes (au moins une doit correspondre).
     *
     * @param  array<int, string>  $columns  Noms de colonnes internes, jamais saisis par l'utilisateur.
     */
    protected function applyTextSearch(Builder $query, array $columns, string $term): Builder
    {
        // Le terme est découpé en mots, et CHACUN doit se retrouver quelque part. Une
        // recherche « contient » sur la chaîne entière échoue dès que l'information est
        // répartie sur plusieurs colonnes : « pistolet 600W Tolsen » ne figure ni dans
        // `name` (« Pistolet à peinture électrique 600W ») ni dans `brand` (« Tolsen »),
        // alors que le produit correspond parfaitement.
        $tokens = preg_split('/\s+/', trim($term), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        // Plafond : au-delà, l'utilisateur a saisi une phrase, pas une recherche, et
        // chaque mot supplémentaire ajoute une jointure de conditions pour rien.
        $tokens = array_slice($tokens, 0, 6);

        if ($tokens === []) {
            return $query;
        }

        return $query->where(function (Builder $outer) use ($columns, $tokens) {
            foreach ($tokens as $token) {
                $outer->where(function (Builder $q) use ($columns, $token) {
                    foreach ($columns as $column) {
                        if (! $this->isPostgres($q)) {
                            // SQLite / MySQL : `LIKE` y est déjà insensible à la casse,
                            // et `translate()` n'existe pas sur SQLite.
                            $q->orWhere($column, 'like', '%' . $token . '%');

                            continue;
                        }

                        $q->orWhereRaw(
                            'translate(' . $this->wrapColumn($q, $column) . ', ?, ?) ILIKE translate(?, ?, ?)',
                            [self::ACCENTED, self::PLAIN, '%' . $token . '%', self::ACCENTED, self::PLAIN],
                        );
                    }
                });
            }
        });
    }

    /**
     * Ajoute une correspondance sur un numéro réduit à ses seuls chiffres, pour que la
     * mise en forme (espaces, tirets, parenthèses) cesse de faire échouer la recherche.
     * Sans effet si le terme ne contient aucun chiffre.
     */
    protected function orWhereSameDigits(Builder $query, string $column, string $term): Builder
    {
        $digits = preg_replace('/\D+/', '', $term);

        if ($digits === '' || $digits === null) {
            return $query;
        }

        if (! $this->isPostgres($query)) {
            // SQLite n'a pas regexp_replace : on retire les séparateurs usuels un à un.
            // Réduire seulement le TERME ne servirait à rien — c'est la valeur stockée
            // qui porte les espaces (« +225 09 87 65 43 22 »).
            $stripped = $this->wrapColumn($query, $column);
            foreach ([' ', '-', '(', ')', '.', '+', '/'] as $separator) {
                $stripped = "replace({$stripped}, '{$separator}', '')";
            }

            return $query->orWhereRaw("{$stripped} LIKE ?", ['%' . $digits . '%']);
        }

        return $query->orWhereRaw(
            "regexp_replace(" . $this->wrapColumn($query, $column) . ", '\\D', '', 'g') LIKE ?",
            ['%' . $digits . '%'],
        );
    }
}
