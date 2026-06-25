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

        // Create checkout session with Paddle
        try {
            $checkout = $user->checkout([
                $plan->paddle_price_id => [
                    'quantity' => 1,
                ]
            ], [
                'redirect_url' => $request->input('redirect_url'),
            ]);

            return response()->json([
                'checkout_url' => $checkout->checkout_url,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Checkout creation failed'], 500);
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
