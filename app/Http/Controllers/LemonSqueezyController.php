<?php

namespace App\Http\Controllers;

use App\Models\LemonSqueezyOrder;
use App\Models\LemonSqueezyProduct;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Services\LemonSqueezyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
            'order_completed' => $this->handleOrderCompleted($objectData),
            'order_refunded' => $this->handleOrderRefunded($objectData),
            'subscription_created' => $this->handleSubscriptionCreated($objectData),
            'subscription_cancelled' => $this->handleSubscriptionCancelled($objectData),
            'subscription_expired' => $this->handleSubscriptionExpired($objectData),
            default => Log::info('Unhandled LemonSqueezy event', ['event' => $eventType])
        };

        return response()->json(['success' => true]);
    }

    private function handleOrderCreated(array $data): void
    {
        $orderId = $data['id'] ?? null;
        $customData = $data['attributes']['user_defined_json'] ?? [];

        $order = LemonSqueezyOrder::where('lemon_order_id', $orderId)->first();

        if ($order) {
            $order->update(['order_data' => $data]);
        }
    }

    private function handleOrderCompleted(array $data): void
    {
        $orderId = $data['id'] ?? null;
        $customData = $data['attributes']['user_defined_json'] ?? [];

        $order = LemonSqueezyOrder::where('lemon_order_id', $orderId)->firstOrFail();
        $order->update(['status' => 'paid']);

        if ($order->subscription_plan_id && $order->user_id) {
            Subscription::where('user_id', $order->user_id)
                ->where('subscription_plan_id', $order->subscription_plan_id)
                ->update(['status' => 'active']);
        }
    }

    private function handleOrderRefunded(array $data): void
    {
        $orderId = $data['id'] ?? null;

        LemonSqueezyOrder::where('lemon_order_id', $orderId)->update([
            'status' => 'refunded'
        ]);
    }

    private function handleSubscriptionCreated(array $data): void
    {
        $subscriptionId = $data['id'] ?? null;
        $customData = $data['attributes']['user_defined_json'] ?? [];

        if ($subscriptionId) {
            Log::info('LemonSqueezy subscription created', ['subscription_id' => $subscriptionId]);
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

            Log::info('LemonSqueezy subscription cancelled', ['subscription_id' => $subscriptionId]);
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

            Log::info('LemonSqueezy subscription expired', ['subscription_id' => $subscriptionId]);
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
