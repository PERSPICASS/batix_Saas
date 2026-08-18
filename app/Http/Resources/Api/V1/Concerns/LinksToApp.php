<?php

namespace App\Http\Resources\Api\V1\Concerns;

/**
 * Construit l'URL de la page applicative d'un document (devis, facture).
 *
 * Le lien est renvoyé comme une DONNÉE plutôt que laissé à composer au client. Pour
 * l'assistant IA, c'est la différence entre citer une valeur reçue et fabriquer une URL
 * à partir d'un gabarit — la seconde option invite à inventer un identifiant ou un
 * segment de chemin, et produit un lien mort que l'utilisateur découvre en cliquant.
 *
 * Le segment de compte est le `code_user` du PROPRIÉTAIRE de la boutique, pas celui de
 * l'utilisateur courant : un employé navigue sous le code de son patron (même règle que
 * `routeParams.code_user` côté Inertia). Prendre son propre code produirait une URL
 * valide en apparence mais refusée à l'ouverture.
 *
 * Il s'agit de la page interne, protégée par l'authentification — surtout pas du lien
 * de partage public signé (`DocumentLink`), destiné au client final et qui n'a rien à
 * faire dans une réponse d'API généraliste.
 *
 * Renvoie null si la boutique ou son propriétaire n'est pas chargé : une URL absente se
 * gère, une URL fausse se clique.
 */
trait LinksToApp
{
    private function appDocumentUrl(string $routeName, string $parameter, ?int $documentId): ?string
    {
        $ownerCode = $this->shop?->user?->code_user;

        if ($ownerCode === null || $documentId === null) {
            return null;
        }

        return route($routeName, ['code_user' => $ownerCode, $parameter => $documentId]);
    }
}
