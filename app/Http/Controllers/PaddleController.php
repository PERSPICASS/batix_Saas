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
            $paddleKey = config('services.paddle.secret');
            $successUrl = route('paddle.success') . '?plan_slug=' . $plan->slug;
            $cancelUrl = route('paddle.cancel');

            // Create checkout session with Paddle API
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $paddleKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.paddle.com/checkouts', [
                'items' => [
                    [
                        'priceId' => $plan->paddle_price_id,
                        'quantity' => 1,
                    ]
                ],
                'customData' => [
                    'user_id' => $user->id,
                    'plan_slug' => $plan->slug,
                ],
                'successUrl' => $successUrl,
                'cancelUrl' => $cancelUrl,
            ]);

            if ($response->failed()) {
                throw new \Exception('Paddle API error: ' . $response->body());
            }

            $checkoutData = $response->json();

            return response()->json([
                'checkout' => $checkoutData,
            ]);
        } catch (\Exception $e) {
            \Log::error('Paddle checkout error: ' . $e->getMessage());
            return response()->json(['error' => 'Checkout creation failed: ' . $e->getMessage()], 500);
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
