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
            \Log::info('Creating Paddle checkout for plan: ' . $plan->slug);

            // Build the checkout URL with Paddle's URL-based approach
            $checkoutUrl = $this->buildCheckoutUrl($plan, $user);

            \Log::info('Checkout URL: ' . $checkoutUrl);

            return response()->json(['checkout_url' => $checkoutUrl]);
        } catch (\Exception $e) {
            \Log::error('Paddle checkout error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to initiate checkout'], 500);
        }
    }

    private function buildCheckoutUrl(SubscriptionPlan $plan, $user): string
    {
        $baseUrl = 'https://checkout.paddle.com/checkout/price/' . $plan->paddle_price_id;

        $params = [
            'customer_email' => $user->email,
            'success_url' => route('paddle.success') . '?plan_slug=' . $plan->slug,
            'cancel_url' => route('paddle.cancel'),
        ];

        return $baseUrl . '?' . http_build_query($params);
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
