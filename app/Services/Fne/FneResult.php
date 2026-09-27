<?php

namespace App\Services\Fne;

/**
 * Ce qu'un appel à la FNE permet de conclure — et donc ce que le job a le droit de faire.
 *
 * La distinction qui compte est entre `retry` et `uncertain`. L'API n'a pas de clé
 * d'idempotence : renvoyer une requête que la DGI a déjà traitée crée une SECONDE facture
 * fiscale et consomme un second sticker. On ne réessaie donc que lorsqu'on sait que la
 * requête n'a pas été traitée.
 */
final class FneResult
{
    /** La DGI a certifié : référence et QR disponibles. */
    public const CERTIFIED = 'certified';

    /** La DGI a refusé les données ou la clé : réessayer donnerait le même refus. */
    public const REJECTED = 'rejected';

    /** La requête n'a pas été traitée (connexion impossible, service indisponible). */
    public const RETRY = 'retry';

    /** La requête a pu être traitée sans qu'on en ait eu la réponse. */
    public const UNCERTAIN = 'uncertain';

    /**
     * @param  array<string, mixed>  $data
     */
    private function __construct(
        public readonly string $outcome,
        public readonly array $data = [],
        public readonly ?string $message = null,
        public readonly ?int $httpStatus = null,
    ) {}

    public static function certified(array $data, int $status): self
    {
        return new self(self::CERTIFIED, $data, null, $status);
    }

    public static function rejected(string $message, array $data = [], ?int $status = null): self
    {
        return new self(self::REJECTED, $data, $message, $status);
    }

    public static function retry(string $message, ?int $status = null): self
    {
        return new self(self::RETRY, [], $message, $status);
    }

    public static function uncertain(string $message, ?int $status = null): self
    {
        return new self(self::UNCERTAIN, [], $message, $status);
    }

    public function is(string $outcome): bool
    {
        return $this->outcome === $outcome;
    }
}
