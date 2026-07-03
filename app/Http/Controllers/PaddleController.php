<?php

namespace App\Http\Controllers;

use App\Mail\SubscriptionInvoiceMail;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
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
            ],
            'checkout' => [
                'url' => route('paddle.success', ['plan_slug' => $plan->slug]),
            ],
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

    /**
     * Handle a Paddle webhook notification.
     *
     * Signature verification is done by \Laravel\Paddle\Http\Middleware\VerifyWebhookSignature,
     * applied to this route — by the time we get here the payload is authenticated.
     *
     * This app doesn't use Cashier's own Billable subscription tables (App\Models\Subscription /
     * SubscriptionPlan / SubscriptionInvoice are custom, shared with the PawaPay/Jèko flows), so
     * we handle the event ourselves instead of routing through Cashier's native WebhookController.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        $eventType = $payload['event_type'] ?? null;

        \Log::info('Paddle webhook received', ['event_type' => $eventType]);

        if ($eventType !== 'transaction.completed') {
            // Other event types (subscription.*, transaction.updated, ...) aren't used by
            // this app's activation flow — acknowledge so Paddle doesn't retry.
            return response()->json(['status' => 'ignored']);
        }

        $data = $payload['data'] ?? [];
        $customData = $data['custom_data'] ?? [];
        $transactionId = $data['id'] ?? null;

        $userId = $customData['user_id'] ?? null;
        $planSlug = $customData['plan_slug'] ?? null;
        $billingCycle = $customData['billing_cycle'] ?? 'monthly';

        if (!$transactionId || !$userId || !$planSlug) {
            \Log::warning('Paddle webhook: missing transaction/user/plan in custom_data', ['transactionId' => $transactionId]);
            return response()->json(['status' => 'ignored']);
        }

        // Idempotence : Paddle peut renvoyer le même événement plusieurs fois.
        if (Subscription::where('metadata->paddle_transaction_id', $transactionId)->exists()) {
            return response()->json(['status' => 'already_processed']);
        }

        $user = User::find($userId);
        $plan = SubscriptionPlan::where('slug', $planSlug)->first();

        if (!$user || !$plan) {
            \Log::warning('Paddle webhook: unknown user or plan', ['userId' => $userId, 'planSlug' => $planSlug]);
            return response()->json(['status' => 'ignored']);
        }

        $this->activateSubscription($user, $plan, $billingCycle, $transactionId);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Create subscription + invoice after a confirmed Paddle transaction.
     * Mirrors PawaPayController::activateSubscription / JekoController::activateSubscription.
     */
    private function activateSubscription(User $user, SubscriptionPlan $plan, string $billingCycle, string $transactionId): void
    {
        $months = $billingCycle === 'yearly' ? 12 : 1;
        $amount = $billingCycle === 'yearly'
            ? round((float) $plan->price * 10)
            : (float) $plan->price;

        $result = DB::transaction(function () use ($user, $plan, $months, $amount, $billingCycle, $transactionId) {
            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'status' => 'active',
                'started_at' => now(),
                'expires_at' => now()->addMonths($months),
                'amount' => $amount,
                'billing_cycle' => $billingCycle,
                'metadata' => [
                    'payment_method' => 'paddle',
                    'paddle_transaction_id' => $transactionId,
                ],
            ]);

            $invoice = SubscriptionInvoice::create([
                'subscription_id' => $subscription->id,
                'user_id' => $user->id,
                'invoice_number' => SubscriptionInvoice::generateInvoiceNumber(),
                'amount' => $amount,
                'tax' => 0,
                'total' => $amount,
                'status' => 'paid',
                'issued_at' => now(),
                'paid_at' => now(),
                'due_at' => now(),
                'payment_method' => 'paddle',
                'metadata' => [
                    'paddle_transaction_id' => $transactionId,
                ],
            ]);

            return [$subscription, $invoice];
        });

        try {
            [$subscription, $invoice] = $result;
            Mail::to($user->email)->send(
                new SubscriptionInvoiceMail($user, $subscription, $invoice)
            );
        } catch (\Throwable $e) {
            \Log::error('SubscriptionInvoiceMail failed', ['user' => $user->id, 'error' => $e->getMessage()]);
        }
    }

    public function success(Request $request): \Inertia\Response
    {
        $plan = SubscriptionPlan::where('slug', $request->input('plan_slug'))->first();

        return Inertia::render('Payment/Confirmation', [
            'planName' => $plan?->name,
            'message'  => null,
        ]);
    }

    public function cancel(Request $request): \Inertia\Response
    {
        return Inertia::render('Payment/Checkout', [
            'error' => 'Payment cancelled',
        ]);
    }
}
