<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class PaddleController extends Controller
{
    public function checkout(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $user = Auth::user();
        $billingCycle = $request->input('billing_cycle', 'monthly');

        try {
            \Log::info('Creating Paddle transaction for plan: ' . $plan->slug . ' (' . $billingCycle . ')');

            // Create a transaction via Paddle API
            $checkoutUrl = $this->createPaddleTransaction($plan, $user, $billingCycle);

            \Log::info('Checkout URL: ' . $checkoutUrl);

            return response()->json(['checkout_url' => $checkoutUrl]);
        } catch (\Exception $e) {
            \Log::error('Paddle checkout error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to initiate checkout'], 500);
        }
    }

    private function createPaddleTransaction(SubscriptionPlan $plan, $user, string $billingCycle = 'monthly'): string
    {
        $apiKey = config('services.paddle.secret');

        // Select the appropriate price ID based on billing cycle
        $priceId = $billingCycle === 'yearly' && $plan->paddle_price_id_yearly
            ? $plan->paddle_price_id_yearly
            : $plan->paddle_price_id;

        $payload = [
            'items' => [
                [
                    'price_id' => $priceId,
                    'quantity' => 1,
                ]
            ],
            'customer_email' => $user->email,
            'custom_data' => [
                'user_id' => $user->id,
                'plan_slug' => $plan->slug,
                'billing_cycle' => $billingCycle,
            ]
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://api.paddle.com/transactions', $payload);

        if (!$response->successful()) {
            \Log::error('Paddle API error: ' . $response->body());
            throw new \Exception('Failed to create Paddle transaction');
        }

        $data = $response->json();
        $checkoutUrl = $data['data']['checkout']['url'] ?? null;

        if (!$checkoutUrl) {
            throw new \Exception('No checkout URL returned from Paddle');
        }

        return $checkoutUrl;
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
