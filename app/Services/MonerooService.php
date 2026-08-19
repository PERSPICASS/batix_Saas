<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MonerooService
{
    public function isConfigured(): bool
    {
        return config('services.moneroo.api_key', '') !== ''
            && config('services.moneroo.webhook_secret', '') !== '';
    }

    /**
     * @return array{ok: bool, data?: array<string, mixed>, raw?: array<string, mixed>, message?: string}
     */
    public function initializePayment(array $payload): array
    {
        try {
            $response = Http::withToken(config('services.moneroo.api_key'))
                ->acceptJson()
                ->asJson()
                ->connectTimeout(5)
                ->timeout(15)
                ->post($this->baseUrl().'/v1/payments/initialize', $payload);

            $json = $response->json();
            $json = is_array($json) ? $json : [];

            if (! $response->successful() || ! ($json['success'] ?? false)) {
                Log::warning('Moneroo: initialisation refusée', [
                    'status' => $response->status(),
                    'message' => $json['message'] ?? null,
                ]);

                return [
                    'ok' => false,
                    'message' => $json['message'] ?? "Moneroo n'a pas pu ouvrir le paiement.",
                    'raw' => $json,
                ];
            }

            return [
                'ok' => true,
                'data' => is_array($json['data'] ?? null) ? $json['data'] : [],
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('Moneroo: API indisponible pendant l\'initialisation', [
                'error' => $e->getMessage(),
            ]);

            return [
                'ok' => false,
                'message' => 'Le service de paiement est momentanément indisponible.',
            ];
        }
    }

    /**
     * @return array{ok: bool, data?: array<string, mixed>, raw?: array<string, mixed>, message?: string}
     */
    public function verifyPayment(string $paymentId): array
    {
        try {
            $response = Http::withToken(config('services.moneroo.api_key'))
                ->acceptJson()
                // Moneroo attend un accusé de réception du webhook en moins de
                // trois secondes. On échoue vite pour obtenir un retry plutôt que
                // de laisser expirer silencieusement la livraison.
                ->connectTimeout(1)
                ->timeout(2)
                ->get($this->baseUrl()."/v1/payments/{$paymentId}/verify");

            $json = $response->json();
            $json = is_array($json) ? $json : [];

            if (! $response->successful() || ! is_array($json['data'] ?? null)) {
                Log::warning('Moneroo: vérification de paiement refusée', [
                    'payment_id' => $paymentId,
                    'status' => $response->status(),
                    'message' => $json['message'] ?? null,
                ]);

                return [
                    'ok' => false,
                    'message' => $json['message'] ?? 'Impossible de vérifier le paiement.',
                    'raw' => $json,
                ];
            }

            return [
                'ok' => true,
                'data' => $json['data'],
                'raw' => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('Moneroo: API indisponible pendant la vérification', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);

            return [
                'ok' => false,
                'message' => 'Le paiement ne peut pas encore être vérifié.',
            ];
        }
    }

    public function verifyWebhookSignature(string $payload, ?string $signature): bool
    {
        $secret = (string) config('services.moneroo.webhook_secret', '');

        if ($secret === '' || ! $signature) {
            return false;
        }

        $provided = str_starts_with($signature, 'sha256=')
            ? substr($signature, 7)
            : $signature;

        return hash_equals(hash_hmac('sha256', $payload, $secret), $provided);
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.moneroo.base_url', 'https://api.moneroo.io'), '/');
    }
}
