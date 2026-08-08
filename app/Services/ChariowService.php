<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Client HTTP de l'API Chariow (https://chariow.dev).
 *
 * Chariow ne gère que des achats uniques — il n'existe pas d'abonnement
 * récurrent côté prestataire. C'est sans conséquence ici : nos abonnements sont
 * déjà datés (`subscriptions.expires_at` + rappels d'expiration), donc « acheter
 * une période » est exactement le modèle de l'application.
 */
class ChariowService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.chariow.base_url', 'https://api.chariow.com/v1'), '/');
        $this->apiKey  = config('services.chariow.api_key', '');
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    /**
     * Crée une session de paiement et renvoie la réponse brute de l'API.
     *
     * @return array{ok: bool, checkout_url?: string, sale_id?: string, transaction_id?: string, step?: string, message?: string, raw?: array}
     */
    public function createCheckout(array $payload): array
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->timeout(30)
                ->post("{$this->baseUrl}/checkout", $payload);

            $json = $response->json() ?? [];

            if (!$response->successful()) {
                Log::warning('Chariow createCheckout HTTP error', [
                    'status' => $response->status(),
                    'body'   => $json,
                ]);

                return [
                    'ok'      => false,
                    'message' => $json['message'] ?? "Chariow a refusé la demande de paiement.",
                    'raw'     => $json,
                ];
            }

            $data = $json['data'] ?? [];
            $step = $data['step'] ?? null;

            // `completed` est un succès sans page de paiement : le panier est tombé à
            // zéro (code promo à 100 %) et Chariow a finalisé la vente directement.
            // `already_purchased` est en revanche un refus — le contrôleur distingue
            // les trois cas à partir de `step`.
            return [
                'ok'             => in_array($step, ['payment', 'completed'], true),
                'step'           => $step,
                'checkout_url'   => $data['payment']['checkout_url'] ?? null,
                'transaction_id' => $data['payment']['transaction_id'] ?? null,
                'sale_id'        => $data['purchase']['id'] ?? null,
                'message'        => $data['message'] ?? null,
                'raw'            => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('Chariow createCheckout error', [
                'error'     => $e->getMessage(),
                'reference' => $payload['custom_metadata']['ref'] ?? null,
            ]);

            return ['ok' => false, 'message' => 'Impossible de contacter Chariow. Réessayez dans un instant.'];
        }
    }

    /**
     * Relit une vente côté Chariow — utilisé au retour du client, quand le
     * webhook n'est pas encore arrivé.
     */
    public function getSale(string $saleId): array
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->timeout(15)
                ->get("{$this->baseUrl}/sales/{$saleId}");

            return $response->json('data') ?? [];
        } catch (\Throwable $e) {
            Log::error('Chariow getSale error', ['error' => $e->getMessage(), 'sale_id' => $saleId]);

            return [];
        }
    }

    /**
     * Vérifie la signature d'un Pulse.
     *
     * Seul le corps brut est signé — ni la méthode, ni l'URL, ni les en-têtes.
     * Le corps doit donc être lu avant tout parsing JSON : re-sérialiser le
     * payload change l'échappement et casse le digest.
     */
    public function verifyPulseSignature(string $rawBody, ?string $signature, ?string $secret = null): bool
    {
        $secret ??= config('services.chariow.webhook_secret', '');

        if (!$signature || !$secret) {
            return false;
        }

        $expected = 'sha256=' . hash_hmac('sha256', $rawBody, $secret);

        return hash_equals($expected, $signature);
    }
}
