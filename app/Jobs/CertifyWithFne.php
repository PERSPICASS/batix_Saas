<?php

namespace App\Jobs;

use App\Models\CreditNote;
use App\Models\Invoice;
use App\Services\Fne\FneResult;
use App\Services\Fne\FneService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Fait certifier une facture ou un avoir par la FNE.
 *
 * Le danger est le doublon, pas l'échec : l'API n'a pas de clé d'idempotence, et une
 * requête rejouée alors que la DGI l'avait déjà traitée crée une seconde facture fiscale.
 * D'où la réservation atomique `pending → sending` avant tout appel : deux exécutions
 * concurrentes (double dispatch, relance manuelle pendant un essai) ne peuvent pas partir
 * toutes les deux. Et un essai interrompu en plein vol laisse `sending`, que le job ne
 * reprend jamais de lui-même — `failed()` le convertit en `uncertain`.
 *
 * Statuts : pending → sending → certified | failed | uncertain (| pending pour réessayer).
 */
class CertifyWithFne implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Couvre une indisponibilité de la DGI de quelques heures. */
    public int $tries = 8;

    /** Au-delà du délai HTTP (30 s par défaut) : le worker ne doit pas tuer un appel en cours. */
    public int $timeout = 60;

    /** Plus long que la somme des délais de réessai : le verrou d'unicité ne doit pas tomber entre deux essais. */
    public int $uniqueFor = 21600;

    /** @var array<int, int> */
    private const BACKOFF = [60, 300, 900, 1800, 3600, 3600, 3600];

    public function __construct(public Invoice|CreditNote $document)
    {
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return class_basename($this->document).':'.$this->document->getKey();
    }

    public function handle(FneService $fne): void
    {
        if (! $this->claim()) {
            return;
        }

        $document = $this->document->fresh();

        $result = $document instanceof Invoice
            ? $fne->signInvoice($document)
            : $fne->refund($document);

        match ($result->outcome) {
            FneResult::CERTIFIED => $this->recordCertification($document, $result),
            FneResult::RETRY => $this->retryLater($document, $result),
            FneResult::UNCERTAIN => $this->mark($document, 'uncertain', $result->message),
            default => $this->mark($document, 'failed', $result->message),
        };
    }

    /**
     * Un essai tué par le worker (timeout, arrêt) ne dit pas si la DGI a certifié : le
     * document ne doit pas repartir tout seul.
     */
    public function failed(?Throwable $e): void
    {
        $document = $this->document->fresh();

        if ($document && in_array($document->fne_status, ['pending', 'sending'], true)) {
            $this->mark(
                $document,
                $document->fne_status === 'sending' ? 'uncertain' : 'failed',
                'Certification FNE interrompue : '.($e?->getMessage() ?? 'erreur inconnue').'. Vérifiez sur votre espace FNE avant de relancer.'
            );
        }
    }

    /**
     * Réservation atomique : seul l'essai qui fait passer le document de `pending` à
     * `sending` a le droit d'appeler la DGI.
     */
    private function claim(): bool
    {
        return $this->document->newQuery()
            ->whereKey($this->document->getKey())
            ->where('fne_status', 'pending')
            ->update([
                'fne_status' => 'sending',
                'fne_attempts' => DB::raw('fne_attempts + 1'),
            ]) === 1;
    }

    private function recordCertification(Invoice|CreditNote $document, FneResult $result): void
    {
        $data = $result->data;
        $fneInvoice = is_array($data['invoice'] ?? null) ? $data['invoice'] : [];

        $document->forceFill([
            'fne_status' => 'certified',
            'fne_reference' => $data['reference'],
            'fne_verification_url' => $data['token'] ?? null,
            'fne_invoice_id' => $fneInvoice['id'] ?? null,
            'fne_certified_at' => now(),
            'fne_error' => null,
            'fne_response' => $data,
        ])->saveQuietly();

        if ($document instanceof Invoice) {
            $this->recordItemIds($document, $fneInvoice['items'] ?? []);
            $this->checkTotals($document, $fneInvoice);
        }

        if (isset($data['balance_sticker'])) {
            $document->shop->forceFill([
                'fne_balance_sticker' => (int) $data['balance_sticker'],
                'fne_sticker_warning' => filter_var($data['warning'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ])->saveQuietly();
        }
    }

    /**
     * La DGI renvoie ses lignes dans l'ordre reçu. Leur identifiant est ce qu'un avoir
     * FNE désigne : sans lui, aucun avoir ne pourra être certifié sur cette facture.
     */
    private function recordItemIds(Invoice $invoice, mixed $fneItems): void
    {
        $fneItems = is_array($fneItems) ? array_values($fneItems) : [];
        $items = $invoice->items()->orderBy('id')->get();

        if (count($fneItems) !== $items->count()) {
            Log::warning('FNE: nombre de lignes différent dans la réponse', [
                'invoice_id' => $invoice->id,
                'sent' => $items->count(),
                'received' => count($fneItems),
            ]);
        }

        foreach ($items as $index => $item) {
            if ($id = $fneItems[$index]['id'] ?? null) {
                $item->forceFill(['fne_item_id' => $id])->saveQuietly();
            }
        }
    }

    /**
     * La DGI recalcule le TTC à partir des prix HT et de remises en pourcentage : un écart
     * d'arrondi est possible. Il ne bloque rien, la facture certifiée fait foi — mais il
     * doit se voir.
     */
    private function checkTotals(Invoice $invoice, array $fneInvoice): void
    {
        if (! isset($fneInvoice['amount'])) {
            return;
        }

        $gap = abs((float) $fneInvoice['amount'] - (float) $invoice->total);

        if ($gap > 1) {
            Log::warning('FNE: total certifié différent du total BatixPro', [
                'invoice_id' => $invoice->id,
                'batix_total' => (float) $invoice->total,
                'fne_amount' => (float) $fneInvoice['amount'],
            ]);
        }
    }

    private function retryLater(Invoice|CreditNote $document, FneResult $result): void
    {
        if ($this->attempts() >= $this->tries) {
            $this->mark($document, 'failed', $result->message.' Nombre d\'essais épuisé.');

            return;
        }

        $this->mark($document, 'pending', $result->message);
        $this->release(self::BACKOFF[min($this->attempts() - 1, count(self::BACKOFF) - 1)]);
    }

    private function mark(Model $document, string $status, ?string $message): void
    {
        $document->forceFill([
            'fne_status' => $status,
            'fne_error' => $message,
        ])->saveQuietly();
    }
}
