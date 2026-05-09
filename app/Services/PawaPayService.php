<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PawaPayService
{
    private string $baseUrl;
    private string $apiToken;

    public function __construct()
    {
        $sandbox = config('services.pawapay.sandbox', true);

        $this->baseUrl  = $sandbox
            ? 'https://api.sandbox.pawapay.cloud'
            : 'https://api.pawapay.cloud';

        $this->apiToken = config('services.pawapay.api_token', '');
    }

    /**
     * Initiate a mobile money collection (deposit).
     * Returns the full PawaPay API response array.
     */
    public function initiateDeposit(
        string $depositId,
        string $amount,
        string $currency,
        string $correspondent,
        string $msisdn,
        string $description
    ): array {
        try {
            $response = Http::withToken($this->apiToken)
                ->timeout(30)
                ->post("{$this->baseUrl}/deposits", [
                    'depositId'           => $depositId,
                    'amount'              => $amount,
                    'currency'            => $currency,
                    'correspondent'       => $correspondent,
                    'payer'               => [
                        'type'    => 'MSISDN',
                        'address' => ['value' => $msisdn],
                    ],
                    'customerTimestamp'   => now()->toIso8601String(),
                    'statementDescriptor' => substr($description, 0, 22), // PawaPay max 22 chars
                ]);

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('PawaPay initiateDeposit error', ['error' => $e->getMessage(), 'depositId' => $depositId]);
            return ['status' => 'FAILED', 'errorMessage' => $e->getMessage()];
        }
    }

    /**
     * Retrieve deposit status from PawaPay.
     */
    public function getDeposit(string $depositId): array
    {
        try {
            $response = Http::withToken($this->apiToken)
                ->timeout(15)
                ->get("{$this->baseUrl}/deposits/{$depositId}");

            $body = $response->json();

            // PawaPay returns an array with one item
            return is_array($body) && isset($body[0]) ? $body[0] : ($body ?? []);
        } catch (\Throwable $e) {
            Log::error('PawaPay getDeposit error', ['error' => $e->getMessage(), 'depositId' => $depositId]);
            return [];
        }
    }

    /**
     * Get active configuration (available correspondents for your account).
     */
    public function getActiveConf(): array
    {
        try {
            $response = Http::withToken($this->apiToken)
                ->timeout(15)
                ->get("{$this->baseUrl}/active-conf");

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('PawaPay getActiveConf error', ['error' => $e->getMessage()]);
            return [];
        }
    }
}
