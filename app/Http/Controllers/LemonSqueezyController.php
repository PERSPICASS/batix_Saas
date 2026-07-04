<?php

namespace App\Http\Controllers;

use App\Mail\SubscriptionInvoiceMail;
use App\Models\LemonSqueezyOrder;
use App\Models\LemonSqueezyProduct;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Services\LemonSqueezyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class LemonSqueezyController extends Controller
{
    private LemonSqueezyService $service;

    public function __construct(LemonSqueezyService $service)
    {
        $this->service = $service;
    }

    public function checkout(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $request->validate([
            'redirect_url' => 'required|url',
        ]);

        $user = Auth::user();

        $product = LemonSqueezyProduct::where('subscription_plan_id', $plan->id)->firstOrFail();

        $checkout = $this->service->createCheckout($product->lemon_variant_id, [
            'email' => $user->email,
            'name' => $user->name,
            'user_id' => $user->id,
            'redirect_url' => $request->redirect_url,
        ]);

        if (isset($checkout['errors'])) {
            Log::error('LemonSqueezy checkout creation failed', ['plan' => $plan->id, 'errors' => $checkout['errors']]);
            return response()->json(['error' => 'Impossible de créer le paiement'], 500);
        }

        $checkoutId = $checkout['data']['id'] ?? null;
        $checkoutUrl = $checkout['data']['attributes']['url'] ?? null;

        if (!$checkoutId) {
            return response()->json(['error' => 'Données de paiement invalides'], 500);
        }

        LemonSqueezyOrder::create([
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'checkout_id' => $checkoutId,
            'customer_email' => $user->email,
            'customer_name' => $user->name,
            'amount' => $plan->price,
            'currency' => 'EUR',
            'status' => 'pending',
            'order_data' => $checkout['data'],
        ]);

        return response()->json([
            'checkout_url' => $checkoutUrl,
            'checkout_id' => $checkoutId,
        ]);
    }

    public function webhook(Request $request): JsonResponse
    {
        $body = $request->getContent();
        $signature = $request->header('X-Signature', '');

        if (!$this->service->verifyWebhookSignature($body, $signature)) {
            Log::warning('LemonSqueezy invalid webhook signature');
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = $request->json()->all();
        $eventType = $data['meta']['event_name'] ?? null;
        $objectData = $data['data'] ?? [];

        Log::info('LemonSqueezy webhook received', ['event' => $eventType]);

        match($eventType) {
            'order_created' => $this->handleOrderCreated($objectData),
            'order_refunded' => $this->handleOrderRefunded($objectData),
            'subscription_created' => $this->handleSubscriptionCreated($objectData),
            'subscription_payment_success' => $this->handleSubscriptionPaymentSuccess($objectData),
            'subscription_payment_failed' => $this->handleSubscriptionPaymentFailed($objectData),
            'subscription_cancelled' => $this->handleSubscriptionCancelled($objectData),
            'subscription_expired' => $this->handleSubscriptionExpired($objectData),
            default => null
        };

        return response()->json(['success' => true]);
    }

    private function handleOrderCreated(array $data): void
    {
        $orderId = $data['id'] ?? null;
        if ($orderId) {
            LemonSqueezyOrder::updateOrCreate(
                ['lemon_order_id' => $orderId],
                ['order_data' => $data]
            );
        }
    }

    private function handleOrderRefunded(array $data): void
    {
        $orderId = $data['id'] ?? null;
        if ($orderId) {
            LemonSqueezyOrder::where('lemon_order_id', $orderId)->update([
                'status' => 'refunded'
            ]);
        }
    }

    /**
     * Le webhook "subscription_created" ne référence pas directement notre
     * LemonSqueezyOrder par lemon_subscription_id (cette colonne n'est jamais
     * peuplée avant cet événement) — la corrélation se fait via `order_id`,
     * présent dans les attributs de l'abonnement LemonSqueezy, qui pointe vers
     * la commande dont on a stocké le `lemon_order_id` à l'étape checkout.
     */
    private function handleSubscriptionCreated(array $data): void
    {
        $subscriptionId = $data['id'] ?? null;
        $orderId = $data['attributes']['order_id'] ?? null;

        if (!$subscriptionId || !$orderId) {
            return;
        }

        $order = LemonSqueezyOrder::where('lemon_order_id', $orderId)->first();
        if (!$order || !$order->subscription_plan_id || !$order->user_id) {
            return;
        }

        $order->update(['lemon_subscription_id' => $subscriptionId]);

        // Rejeu du webhook : l'abonnement local est déjà lié, rien à refaire.
        if ($order->subscription_id) {
            $order->update(['status' => 'paid']);
            return;
        }

        $user = $order->user;
        $plan = $order->subscriptionPlan;
        if (!$user || !$plan) {
            return;
        }

        [$subscription, $invoice] = DB::transaction(function () use ($user, $plan, $order) {
            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            $subscription = Subscription::create([
                'user_id'              => $user->id,
                'subscription_plan_id' => $plan->id,
                'status'               => 'active',
                'started_at'           => now(),
                'expires_at'           => now()->addMonth(),
                'amount'               => $order->amount,
                'billing_cycle'        => 'monthly',
                'metadata'             => [
                    'payment_method'         => 'lemonsqueezy',
                    'lemon_subscription_id'  => $order->lemon_subscription_id,
                ],
            ]);

            $invoice = SubscriptionInvoice::create([
                'subscription_id' => $subscription->id,
                'user_id'         => $user->id,
                'invoice_number'  => SubscriptionInvoice::generateInvoiceNumber(),
                'amount'          => $order->amount,
                'tax'             => 0,
                'total'           => $order->amount,
                'status'          => 'paid',
                'issued_at'       => now(),
                'paid_at'         => now(),
                'due_at'          => now(),
                'payment_method'  => 'lemonsqueezy',
                'metadata'        => [
                    'lemon_subscription_id' => $order->lemon_subscription_id,
                ],
            ]);

            $order->update(['status' => 'paid', 'subscription_id' => $subscription->id]);

            return [$subscription, $invoice];
        });

        try {
            Mail::to($user->email)->send(new SubscriptionInvoiceMail($user, $subscription, $invoice));
        } catch (\Throwable $e) {
            Log::error('SubscriptionInvoiceMail failed', ['user' => $user->id, 'error' => $e->getMessage()]);
        }
    }

    private function handleSubscriptionPaymentSuccess(array $data): void
    {
        $subscriptionId = $data['id'] ?? null;
        if ($subscriptionId) {
            $order = LemonSqueezyOrder::where('lemon_subscription_id', $subscriptionId)->first();
            if ($order && $order->subscription_id) {
                $order->subscription->update(['status' => 'active']);
            }
        }
    }

    private function handleSubscriptionPaymentFailed(array $data): void
    {
        $subscriptionId = $data['id'] ?? null;
        if ($subscriptionId) {
            Log::warning('LemonSqueezy subscription payment failed', [
                'subscription_id' => $subscriptionId,
                'data' => $data
            ]);
        }
    }

    private function handleSubscriptionCancelled(array $data): void
    {
        $subscriptionId = $data['id'] ?? null;
        if ($subscriptionId) {
            $order = LemonSqueezyOrder::where('lemon_subscription_id', $subscriptionId)->first();
            if ($order && $order->subscription_id) {
                $order->subscription->cancel();
            }
        }
    }

    private function handleSubscriptionExpired(array $data): void
    {
        $subscriptionId = $data['id'] ?? null;
        if ($subscriptionId) {
            $order = LemonSqueezyOrder::where('lemon_subscription_id', $subscriptionId)->first();
            if ($order && $order->subscription_id) {
                $order->subscription->update(['status' => 'expired']);
            }
        }
    }

    public function syncProducts(): JsonResponse
    {
        $plans = SubscriptionPlan::where('is_active', true)->get();
        $synced = 0;
        $errors = [];

        foreach ($plans as $plan) {
            $productData = $this->service->createProduct([
                'name' => $plan->name,
                'description' => $plan->description,
            ]);

            if (isset($productData['errors'])) {
                $errors[] = "Erreur pour le plan {$plan->name}: " . json_encode($productData['errors']);
                continue;
            }

            $productId = $productData['data']['id'] ?? null;

            if (!$productId) {
                $errors[] = "ID de produit introuvable pour {$plan->name}";
                continue;
            }

            $variantData = $this->service->createVariant($productId, [
                'name' => $plan->name,
                'price' => (int)($plan->price * 100),
                'interval' => 1,
                'interval_unit' => 'month',
                'is_subscription' => true,
            ]);

            if (isset($variantData['errors'])) {
                $errors[] = "Erreur variant pour {$plan->name}: " . json_encode($variantData['errors']);
                continue;
            }

            $variantId = $variantData['data']['id'] ?? null;

            if (!$variantId) {
                $errors[] = "ID de variante introuvable pour {$plan->name}";
                continue;
            }

            LemonSqueezyProduct::updateOrCreate(
                ['subscription_plan_id' => $plan->id],
                [
                    'lemon_product_id' => $productId,
                    'lemon_variant_id' => $variantId,
                    'name' => $plan->name,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'currency' => 'EUR',
                    'product_data' => $productData['data'],
                    'variant_data' => $variantData['data'],
                ]
            );

            $synced++;
        }

        return response()->json([
            'success' => true,
            'synced' => $synced,
            'errors' => $errors,
        ]);
    }
}
