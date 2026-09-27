<?php

namespace App\Services\Fne;

use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shop;
use App\Support\GlobalDiscount;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Client de l'API FNE de la DGI (Côte d'Ivoire), spec « Procédure d'interfaçage des
 * entreprises par API », mai 2025.
 *
 * Deux appels seulement : certifier une facture de vente, et certifier un avoir sur une
 * facture déjà certifiée. Ce service ne touche pas à la base : il construit la requête,
 * l'envoie, et dit ce qu'on peut conclure de la réponse (FneResult). C'est le job qui
 * décide quoi en faire.
 */
class FneService
{
    /** Codes de TVA de la DGI pour les taux non nuls. Le 0 % dépend du régime de la boutique. */
    public const TAX_CODES = [
        '18' => 'TVA',
        '9' => 'TVAB',
    ];

    /** Exonérations à 0 % : conventionnelle (TVAC) ou légale, dont TEE et RME (TVAD). */
    public const ZERO_RATE_CODES = ['TVAC', 'TVAD'];

    /** Clients acceptés en v1. B2F (export) exige une devise étrangère, que l'app ne gère pas. */
    public const TEMPLATES = ['B2C', 'B2B', 'B2G'];

    private const PAYMENT_METHODS = [
        'cash' => 'cash',
        'card' => 'card',
        'check' => 'check',
        'transfer' => 'transfer',
        'mobile' => 'mobile-money',
    ];

    public function signInvoice(Invoice $invoice): FneResult
    {
        try {
            $payload = $this->buildInvoicePayload($invoice);
        } catch (FneDataException $e) {
            return FneResult::rejected($e->getMessage());
        }

        return $this->post($invoice->shop, '/external/invoices/sign', $payload, [
            'invoice_id' => $invoice->id,
        ]);
    }

    public function refund(CreditNote $creditNote): FneResult
    {
        $invoice = $creditNote->invoice;

        if (! $invoice?->fne_invoice_id) {
            return FneResult::rejected("La facture d'origine n'est pas certifiée FNE : l'avoir ne peut pas l'être.");
        }

        try {
            $payload = $this->buildRefundPayload($creditNote);
        } catch (FneDataException $e) {
            return FneResult::rejected($e->getMessage());
        }

        return $this->post($creditNote->shop, "/external/invoices/{$invoice->fne_invoice_id}/refund", $payload, [
            'credit_note_id' => $creditNote->id,
        ]);
    }

    /**
     * Vérifie la clé sans rien certifier.
     *
     * L'API n'a aucun endpoint de lecture. On envoie donc un corps volontairement vide :
     * la DGI répond 401 si la clé est refusée, 400 si elle l'accepte mais rejette les
     * données — ce qui prouve que l'authentification est passée.
     *
     * @return array{ok: bool, message: string}
     */
    public function testConnection(Shop $shop): array
    {
        if (! $shop->fneBaseUrl() || blank($shop->fne_api_key)) {
            return ['ok' => false, 'message' => "Renseignez la clé API et, en production, l'URL transmise par la DGI."];
        }

        try {
            $response = $this->client($shop)->post($shop->fneBaseUrl().'/external/invoices/sign', ['invoiceType' => 'sale']);
        } catch (ConnectionException $e) {
            return ['ok' => false, 'message' => 'La plateforme FNE ne répond pas : '.$e->getMessage()];
        }

        return match (true) {
            $response->status() === 401 => ['ok' => false, 'message' => 'La DGI refuse cette clé API.'],
            $response->status() === 400 => ['ok' => true, 'message' => 'Clé API acceptée par la DGI.'],
            default => ['ok' => false, 'message' => "Réponse inattendue de la FNE (HTTP {$response->status()})."],
        };
    }

    /**
     * Ce qui empêche une boutique ou un client de faire certifier une facture, vérifiable
     * avant l'émission — donc avant que la facture ne devienne immuable.
     *
     * @param  array<int, float|int|string|null>  $taxRates
     * @return array<int, string>
     */
    public function issuanceProblems(Shop $shop, ?Customer $customer, array $taxRates): array
    {
        $problems = [];

        if (blank($shop->fne_establishment) || blank($shop->fne_point_of_sale)) {
            $problems[] = "Renseignez l'établissement et le point de vente FNE dans les réglages de la boutique.";
        }

        if ($shop->fne_environment === 'prod' && blank($shop->fne_base_url)) {
            $problems[] = "Renseignez l'URL de production FNE transmise par la DGI.";
        }

        if ($customer && ($customer->fne_template ?: 'B2C') === 'B2B' && blank($customer->ncc)) {
            $problems[] = "Le client « {$customer->name} » est une entreprise (B2B) : son NCC est obligatoire pour la FNE.";
        }

        foreach (array_unique(array_map(fn ($rate) => (float) ($rate ?? 0), $taxRates)) as $rate) {
            if ($this->taxCode($rate, 'TVAD') === null) {
                $problems[] = "Le taux de TVA de {$this->formatRate($rate)} % n'existe pas à la FNE (taux admis : 18 %, 9 % ou 0 %).";
            }
        }

        return $problems;
    }

    /**
     * Refuser l'émission d'une facture que la DGI rejetterait à coup sûr.
     *
     * Une facture émise ne se modifie plus : si elle part avec un taux de TVA inconnu de
     * la FNE, elle ne pourra jamais être certifiée. Sans effet pour une boutique hors FNE.
     *
     * @param  array<int, float|int|string|null>  $taxRates
     *
     * @throws ValidationException
     */
    public function assertIssuable(Shop $shop, ?Customer $customer, array $taxRates): void
    {
        if (! $shop->fneActive()) {
            return;
        }

        if ($problems = $this->issuanceProblems($shop, $customer, $taxRates)) {
            throw ValidationException::withMessages(['fne' => $problems]);
        }
    }

    /**
     * @return array<string, mixed>
     *
     * @throws FneDataException
     */
    public function buildInvoicePayload(Invoice $invoice): array
    {
        $invoice->loadMissing(['shop', 'customer', 'items.product']);

        $shop = $invoice->shop;
        $customer = $invoice->customer;

        $problems = $this->issuanceProblems($shop, $customer, $invoice->items->pluck('tax_rate')->all());
        if ($problems !== []) {
            throw new FneDataException(implode(' ', $problems));
        }

        if ($invoice->items->isEmpty()) {
            throw new FneDataException('La facture ne contient aucune ligne.');
        }

        $template = $customer?->fne_template ?: 'B2C';
        $zeroCode = in_array($shop->fne_zero_rate_code, self::ZERO_RATE_CODES, true) ? $shop->fne_zero_rate_code : 'TVAD';

        $items = $invoice->items->map(function ($item) use ($zeroCode) {
            $gross = (float) $item->unit_price * (int) $item->quantity;

            $line = [
                'taxes' => [$this->taxCode((float) $item->tax_rate, $zeroCode)],
                'description' => $item->product_name ?: ($item->description ?: 'Article'),
                'quantity' => (int) $item->quantity,
                // Prix unitaire HT : c'est ce que stocke InvoiceItem, la taxe étant
                // calculée à part dans son hook saving.
                'amount' => (float) $item->unit_price,
                // La FNE attend des pourcentages, BatixPro stocke des montants.
                'discount' => $this->percentOf((float) $item->discount_amount, $gross),
            ];

            if ($sku = $item->product?->sku) {
                $line['reference'] = $sku;
            }

            if ($unit = $item->product?->unit) {
                $line['measurementUnit'] = $unit;
            }

            return $line;
        })->values()->all();

        // Même base que Invoice::calculateTotals() : le HT après remises de ligne.
        $base = (float) $invoice->items->sum(fn ($item) => (float) $item->unit_price * (int) $item->quantity - (float) $item->discount_amount);
        $globalDiscount = GlobalDiscount::effective($base, (float) $invoice->discount_amount);

        $payload = [
            'invoiceType' => 'sale',
            'paymentMethod' => $this->paymentMethod($invoice),
            'template' => $template,
            'isRne' => false,
            'clientCompanyName' => $customer?->name ?: 'Client comptant',
            'clientPhone' => $this->phone($customer?->phone),
            'clientEmail' => (string) ($customer?->email ?? ''),
            'clientSellerName' => $invoice->user?->name,
            'pointOfSale' => $shop->fne_point_of_sale,
            'establishment' => $shop->fne_establishment,
            'foreignCurrency' => '',
            'foreignCurrencyRate' => 0,
            'items' => $items,
            'discount' => $this->percentOf($globalDiscount, $base),
        ];

        if ($template === 'B2B') {
            $payload['clientNcc'] = $customer->ncc;
        }

        return array_filter($payload, fn ($value) => $value !== null);
    }

    /**
     * @return array{items: array<int, array{id: string, quantity: int}>}
     *
     * @throws FneDataException
     */
    public function buildRefundPayload(CreditNote $creditNote): array
    {
        $creditNote->loadMissing('items');

        $invoiceItems = $creditNote->invoice->items()->get()->keyBy('id');

        $items = [];
        foreach ($creditNote->items as $line) {
            $fneItemId = $invoiceItems->get($line->invoice_item_id)?->fne_item_id;

            if (! $fneItemId) {
                throw new FneDataException("La ligne « {$line->product_name} » n'a pas d'identifiant FNE : la facture d'origine doit être certifiée ligne à ligne.");
            }

            $items[] = ['id' => $fneItemId, 'quantity' => (int) $line->quantity];
        }

        return ['items' => $items];
    }

    public function taxCode(float $rate, string $zeroCode): ?string
    {
        if (abs($rate) < 0.001) {
            return $zeroCode;
        }

        foreach (self::TAX_CODES as $known => $code) {
            if (abs($rate - (float) $known) < 0.001) {
                return $code;
            }
        }

        return null;
    }

    /**
     * Une facture émise non payée est « à terme » pour la DGI : son règlement ultérieur ne
     * modifie pas une facture déjà certifiée.
     */
    private function paymentMethod(Invoice $invoice): string
    {
        if ($invoice->status !== 'paid') {
            return 'deferred';
        }

        return self::PAYMENT_METHODS[$invoice->payment_method] ?? 'cash';
    }

    private function percentOf(float $amount, float $base): float
    {
        if ($amount <= 0 || $base <= 0) {
            return 0;
        }

        return round($amount / $base * 100, 2);
    }

    private function phone(?string $phone): string
    {
        return preg_replace('/[^0-9+]/', '', (string) $phone);
    }

    private function formatRate(float $rate): string
    {
        return rtrim(rtrim(number_format($rate, 2, ',', ''), '0'), ',');
    }

    private function client(Shop $shop)
    {
        return Http::withToken((string) $shop->fne_api_key)
            ->acceptJson()
            ->asJson()
            ->connectTimeout(10)
            ->timeout(config('services.fne.timeout', 30));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $context
     */
    private function post(Shop $shop, string $path, array $payload, array $context): FneResult
    {
        if (! $shop->fneBaseUrl()) {
            return FneResult::rejected("L'URL de production FNE n'est pas renseignée pour cette boutique.");
        }

        try {
            $response = $this->client($shop)->post($shop->fneBaseUrl().$path, $payload);
        } catch (ConnectionException $e) {
            return $this->fromConnectionFailure($e, $context);
        }

        return $this->fromResponse($response, $context);
    }

    private function fromResponse(Response $response, array $context): FneResult
    {
        $json = $response->json();
        $json = is_array($json) ? $json : [];
        $status = $response->status();

        if ($response->successful() && filled($json['reference'] ?? null)) {
            return FneResult::certified($json, $status);
        }

        $message = $this->errorMessage($json, $status);

        Log::warning('FNE: certification non obtenue', $context + [
            'status' => $status,
            'message' => $message,
        ]);

        // 500/502/503 : le service n'a pas traité la requête, on peut la rejouer. 504 et
        // tout 2xx sans référence : la DGI a peut-être certifié — rejouer risquerait un
        // doublon fiscal.
        return match (true) {
            in_array($status, [429, 500, 502, 503], true) => FneResult::retry($message, $status),
            $status >= 400 && $status < 500 => FneResult::rejected($message, $json, $status),
            default => FneResult::uncertain($message, $status),
        };
    }

    private function fromConnectionFailure(ConnectionException $e, array $context): FneResult
    {
        $message = $e->getMessage();

        // Connexion jamais établie (DNS, refus, délai de CONNEXION dépassé) : rien n'est
        // parti, on peut réessayer. Un délai de LECTURE dépassé veut dire que la requête
        // est partie — la DGI l'a peut-être certifiée.
        $neverSent = preg_match('/Could not resolve host|Failed to connect|Connection refused|Connection timed out|Resolving timed out/i', $message) === 1;

        Log::warning('FNE: plateforme injoignable', $context + [
            'error' => $message,
            'never_sent' => $neverSent,
        ]);

        return $neverSent
            ? FneResult::retry('La plateforme FNE est injoignable.')
            : FneResult::uncertain('La plateforme FNE n\'a pas répondu à temps : la facture a peut-être été certifiée. Vérifiez sur votre espace FNE avant de relancer.');
    }

    private function errorMessage(array $json, int $status): string
    {
        $message = $json['message'] ?? null;

        if (is_array($message)) {
            $message = implode(' ', array_filter($message, 'is_string'));
        }

        return match (true) {
            $status === 401 => 'La DGI refuse la clé API FNE de cette boutique.',
            filled($message) => "FNE : {$message}",
            default => "La FNE a répondu HTTP {$status}.",
        };
    }
}
