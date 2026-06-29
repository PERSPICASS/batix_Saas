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
            $apiKey = config('services.paddle.secret');

            if (!$apiKey) {
                throw new \Exception('Paddle API key not configured');
            }

            \Log::info('Creating Paddle checkout for plan: ' . $plan->slug);

            // Create checkout session via Paddle API
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
            ])->post('https://api.paddle.com/checkouts', [
                'items' => [
                    [
                        'price_id' => $plan->paddle_price_id,
                        'quantity' => 1,
                    ]
                ],
                'customer_email' => $user->email,
                'custom_data' => [
                    'user_id' => (string)$user->id,
                    'plan_slug' => $plan->slug,
                ],
            ]);

            \Log::info('Paddle API response status: ' . $response->status());
            \Log::info('Paddle API response: ' . $response->body());

            if ($response->failed()) {
                $error = $response->json();
                $message = $error['errors'][0]['details'] ?? $error['errors'][0]['code'] ?? 'Unknown error';
                throw new \Exception('Paddle API: ' . $message);
            }

            $data = $response->json();
            $checkout = $data['data'] ?? $data;

            if (!isset($checkout['id'])) {
                throw new \Exception('No checkout ID in response: ' . json_encode($checkout));
            }

            return response()->json([
                'checkout' => [
                    'id' => $checkout['id'],
                    'email' => $user->email,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Paddle checkout error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
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
