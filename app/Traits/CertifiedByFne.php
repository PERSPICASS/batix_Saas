<?php

namespace App\Traits;

use App\Jobs\CertifyWithFne;

/**
 * Un document (facture, avoir) que la FNE peut certifier.
 *
 * `fne_status` vaut null tant que le document n'a jamais été présenté à la DGI — boutique
 * hors Côte d'Ivoire, FNE non activée, ou facture émise avant l'activation.
 */
trait CertifiedByFne
{
    /** Présenter (ou représenter) le document à la FNE. */
    public function queueFneCertification(): void
    {
        $this->forceFill([
            'fne_status' => 'pending',
            'fne_error' => null,
        ])->saveQuietly();

        CertifyWithFne::dispatch($this);
    }

    /**
     * Le document est, ou a pu être, certifié par la DGI. Il existe alors — peut-être —
     * une pièce fiscale à son nom : on ne l'annule plus, on émet un avoir.
     */
    public function fneEngaged(): bool
    {
        return $this->fne_status !== null && $this->fne_status !== 'failed';
    }

    /**
     * Relancer n'a de sens qu'après un échec, ou une incertitude que l'utilisateur a levée
     * en vérifiant sur son espace FNE.
     */
    public function fneRetryable(): bool
    {
        return in_array($this->fne_status, ['failed', 'uncertain'], true);
    }
}
