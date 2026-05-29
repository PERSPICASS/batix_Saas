<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JekoService
{
    private string $baseUrl = 'https://api.jeko.africa';
    private string $apiKey;
    private string $apiKeyId;

    public function __construct()
    {
        $this->apiKey = config('services.jeko.api_key', '');
        $this->apiKeyId = config('services.jeko.api_key_id', '');
    }

    public function createPaymentRequest(array $params): array
    {
        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
                'X-API-KEY-ID' => $this->apiKeyId,
            ])
            ->timeout(30)
            ->post("{$this->baseUrl}/partner_api/payment_requests", $params);

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('Jèko createPaymentRequest error', [
                'error' => $e->getMessage(),
                'reference' => $params['reference'] ?? null,
            ]);
            return ['status' => 'error', 'errorMessage' => $e->getMessage()];
        }
    }

    public function getPaymentRequest(string $paymentRequestId): array
    {
        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
                'X-API-KEY-ID' => $this->apiKeyId,
            ])
            ->timeout(15)
            ->get("{$this->baseUrl}/partner_api/payment_requests/{$paymentRequestId}");

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('Jèko getPaymentRequest error', [
                'error' => $e->getMessage(),
                'paymentRequestId' => $paymentRequestId,
            ]);
            return [];
        }
    }
}
