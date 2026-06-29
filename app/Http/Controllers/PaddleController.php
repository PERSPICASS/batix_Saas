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

            // First, ensure customer exists in Paddle
            if (!$user->paddle_id) {
                $customerResponse = \Illuminate\Support\Facades\Http::withHeaders([
                    'Authorization' => 'Bearer ' . $paddleApiKey,
                ])->post('https://api.paddle.com/customers', [
                    'email' => $user->email,
                    'name' => $user->name,
                ]);

                if ($customerResponse->successful()) {
                    $customerId = $customerResponse->json()['data']['id'];
                    $user->update(['paddle_id' => $customerId]);
                } else {
                    throw new \Exception('Failed to create Paddle customer');
                }
            } else {
                $customerId = $user->paddle_id;
            }

            // Now create a checkout session with Paddle
            $checkoutResponse = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $paddleApiKey,
            ])->post('https://api.paddle.com/checkouts', [
                'items' => [
                    [
                        'price_id' => $plan->paddle_price_id,
                        'quantity' => 1,
                    ]
                ],
                'customer_id' => $customerId,
                'success_url' => route('paddle.success') . '?plan_slug=' . $plan->slug,
                'cancel_url' => route('paddle.cancel'),
            ]);

            if ($checkoutResponse->failed()) {
                $error = $checkoutResponse->json();
                throw new \Exception($error['error']['detail'] ?? 'Checkout creation failed');
            }

            $checkout = $checkoutResponse->json();

            return response()->json([
                'checkout' => $checkout['data'] ?? $checkout,
            ]);
        } catch (\Exception $e) {
            \Log::error('Paddle checkout error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
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
