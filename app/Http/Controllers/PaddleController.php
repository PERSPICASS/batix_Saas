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
            $successUrl = route('paddle.success') . '?plan_slug=' . $plan->slug;
            $cancelUrl = route('paddle.cancel');

            // Return the checkout session data for Paddle Checkout JS
            // Paddle Checkout v2 will handle the actual payment processing
            $checkoutData = [
                'customerId' => $user->paddle_id ?? 'guest_' . uniqid(),
                'items' => [
                    [
                        'priceId' => $plan->paddle_price_id,
                        'quantity' => 1,
                    ]
                ],
                'successUrl' => $successUrl,
                'cancelUrl' => $cancelUrl,
            ];

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
