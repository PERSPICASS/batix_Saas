<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LemonSqueezyService
{
    private string $baseUrl = 'https://api.lemonsqueezy.com/v1';
    private string $apiKey;
    private string $storeId;

    public function __construct()
    {
        $this->apiKey = config('services.lemonsqueezy.api_key', '');
        $this->storeId = config('services.lemonsqueezy.store_id', '');
    }

    private function getHeaders(): array
    {
        return [
            'Accept' => 'application/vnd.api+json',
            'Content-Type' => 'application/vnd.api+json',
            'Authorization' => "Bearer {$this->apiKey}",
        ];
    }

    public function createProduct(array $data): array
    {
        try {
            $payload = [
                'data' => [
                    'type' => 'products',
                    'attributes' => [
                        'name' => $data['name'],
                        'description' => $data['description'] ?? '',
                        'status' => 'published',
                    ],
                ]
            ];

            $response = Http::withHeaders($this->getHeaders())
                ->timeout(30)
                ->post("{$this->baseUrl}/products", $payload);

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy createProduct error', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            return ['errors' => ['message' => $e->getMessage()]];
        }
    }

    public function createVariant(int $productId, array $data): array
    {
        try {
            $payload = [
                'data' => [
                    'type' => 'variants',
                    'attributes' => [
                        'name' => $data['name'],
                        'price' => $data['price'],
                        'interval' => $data['interval'] ?? 1,
                        'interval_unit' => $data['interval_unit'] ?? 'month',
                        'is_pay_what_you_want' => false,
                        'has_license_keys' => false,
                        'is_subscription' => $data['is_subscription'] ?? true,
                    ],
                    'relationships' => [
                        'product' => [
                            'data' => [
                                'type' => 'products',
                                'id' => (string)$productId,
                            ]
                        ]
                    ]
                ]
            ];

            $response = Http::withHeaders($this->getHeaders())
                ->timeout(30)
                ->post("{$this->baseUrl}/products/{$productId}/variants", $payload);

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy createVariant error', [
                'error' => $e->getMessage(),
                'productId' => $productId,
                'data' => $data,
            ]);
            return ['errors' => ['message' => $e->getMessage()]];
        }
    }

    public function getProduct(int $productId): array
    {
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(15)
                ->get("{$this->baseUrl}/products/{$productId}");

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy getProduct error', [
                'error' => $e->getMessage(),
                'productId' => $productId,
            ]);
            return [];
        }
    }

    public function getVariants(int $productId): array
    {
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(15)
                ->get("{$this->baseUrl}/products/{$productId}/variants");

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy getVariants error', [
                'error' => $e->getMessage(),
                'productId' => $productId,
            ]);
            return [];
        }
    }

    public function createCheckout(int $variantId, array $data): array
    {
        try {
            $payload = [
                'data' => [
                    'type' => 'checkouts',
                    'attributes' => [
                        'checkout_data' => [
                            'email' => $data['email'],
                            'name' => $data['name'] ?? null,
                            'custom' => [
                                'user_id' => $data['user_id'] ?? null,
                            ]
                        ],
                        'redirect_url' => $data['redirect_url'] ?? null,
                    ],
                    'relationships' => [
                        'variant' => [
                            'data' => [
                                'type' => 'variants',
                                'id' => (string)$variantId,
                            ]
                        ]
                    ]
                ]
            ];

            $response = Http::withHeaders($this->getHeaders())
                ->timeout(30)
                ->post("{$this->baseUrl}/checkouts", $payload);

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy createCheckout error', [
                'error' => $e->getMessage(),
                'variantId' => $variantId,
            ]);
            return ['errors' => ['message' => $e->getMessage()]];
        }
    }

    public function getCheckout(string $checkoutId): array
    {
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(15)
                ->get("{$this->baseUrl}/checkouts/{$checkoutId}");

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy getCheckout error', [
                'error' => $e->getMessage(),
                'checkoutId' => $checkoutId,
            ]);
            return [];
        }
    }

    public function listSubscriptions(): array
    {
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(15)
                ->get("{$this->baseUrl}/subscriptions");

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy listSubscriptions error', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    public function getSubscription(string $subscriptionId): array
    {
        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(15)
                ->get("{$this->baseUrl}/subscriptions/{$subscriptionId}");

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy getSubscription error', [
                'error' => $e->getMessage(),
                'subscriptionId' => $subscriptionId,
            ]);
            return [];
        }
    }

    public function cancelSubscription(string $subscriptionId): array
    {
        try {
            $payload = [
                'data' => [
                    'type' => 'subscriptions',
                    'id' => $subscriptionId,
                    'attributes' => [
                        'cancelled' => true,
                    ]
                ]
            ];

            $response = Http::withHeaders($this->getHeaders())
                ->timeout(30)
                ->patch("{$this->baseUrl}/subscriptions/{$subscriptionId}", $payload);

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::error('LemonSqueezy cancelSubscription error', [
                'error' => $e->getMessage(),
                'subscriptionId' => $subscriptionId,
            ]);
            return ['errors' => ['message' => $e->getMessage()]];
        }
    }

    public function verifyWebhookSignature(string $body, string $signature): bool
    {
        $secret = config('services.lemonsqueezy.webhook_secret', '');
        if (!$secret) {
            return false;
        }

        $computedSignature = hash_hmac('sha256', $body, $secret);
        return hash_equals($computedSignature, $signature);
    }
}
