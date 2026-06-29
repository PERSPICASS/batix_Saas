<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaddleController extends Controller
{
    public function checkout(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $user = Auth::user();

        try {
            $paddleApiKey = config('services.paddle.secret');

            if (!$paddleApiKey) {
                throw new \Exception('Paddle API key not configured');
            }

            // Ensure user has a Paddle customer ID
            if (!$user->paddle_id) {
                $this->createPaddleCustomer($user, $paddleApiKey);
            }

            $successUrl = route('paddle.success') . '?plan_slug=' . $plan->slug;
            $cancelUrl = route('paddle.cancel');

            // Create a checkout transaction with Paddle API v2
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $paddleApiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.paddle.com/transactions', [
                'items' => [
                    [
                        'price_id' => $plan->paddle_price_id,
                        'quantity' => 1,
                    ]
                ],
                'customer_id' => $user->paddle_id,
            ]);

            if ($response->failed()) {
                $errorBody = $response->body();
                \Log::error('Paddle API error: ' . $errorBody);

                // Extract error details for better debugging
                $errorData = $response->json();
                $errorMsg = $errorData['error']['detail'] ?? 'Unknown error';
                if (isset($errorData['error']['errors'])) {
                    $details = array_map(function($e) {
                        return $e['field'] . ': ' . $e['message'];
                    }, $errorData['error']['errors']);
                    $errorMsg .= ' (' . implode(', ', array_slice($details, 0, 2)) . ')';
                }

                throw new \Exception($errorMsg);
            }

            $transaction = $response->json();

            return response()->json([
                'checkout' => $transaction['data'] ?? $transaction,
            ]);
        } catch (\Exception $e) {
            \Log::error('Paddle checkout error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function createPaddleCustomer($user, $apiKey)
    {
        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.paddle.com/customers', [
                'email' => $user->email,
                'name' => $user->name ?? $user->email,
            ]);

            if ($response->successful()) {
                $customer = $response->json();
                $user->update(['paddle_id' => $customer['data']['id'] ?? null]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create Paddle customer: ' . $e->getMessage());
        }
    }

    public function webhook(Request $request): JsonResponse
    {
        // Paddle will send webhook notifications to this endpoint
        // The Paddle Cashier package handles webhook verification automatically

        $payload = $request->getContent();

        try {
            // The billable model will automatically handle webhook events
            \Laravel\Paddle\Events\WebhookReceived::dispatch($payload);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }

        return response()->json(['status' => 'ok']);
    }

    public function success(Request $request): \Inertia\Response
    {
        return Inertia::render('Payment/Confirmation', [
            'planSlug' => $request->input('plan_slug'),
            'paymentMethod' => 'paddle',
        ]);
    }

    public function cancel(Request $request): \Inertia\Response
    {
        return Inertia::render('Payment/Checkout', [
            'error' => 'Payment cancelled',
        ]);
    }
}
