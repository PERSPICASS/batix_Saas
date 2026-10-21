<?php

namespace App\Console\Commands;

use App\Models\LemonSqueezyProduct;
use App\Models\SubscriptionPlan;
use App\Services\LemonSqueezyService;
use Illuminate\Console\Command;

class SyncLemonSqueezyProducts extends Command
{
    protected $signature = 'lemonsqueezy:sync-products';

    protected $description = 'Synchronize subscription plans with LemonSqueezy products';

    private LemonSqueezyService $service;

    public function __construct(LemonSqueezyService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    public function handle(): int
    {
        $this->info('Starting LemonSqueezy products synchronization...');

        $plans = SubscriptionPlan::where('is_active', true)->get();

        if ($plans->isEmpty()) {
            $this->warn('No active subscription plans found.');
            return 0;
        }

        $synced = 0;
        $failed = 0;

        foreach ($plans as $plan) {
            $this->info("Processing plan: {$plan->name}...");

            $productData = $this->service->createProduct([
                'name' => $plan->name,
                'description' => $plan->description,
            ]);

            if (isset($productData['errors'])) {
                $this->error("Failed to create product for {$plan->name}: " . json_encode($productData['errors']));
                $failed++;
                continue;
            }

            $productId = $productData['data']['id'] ?? null;

            if (!$productId) {
                $this->error("Product ID not found for {$plan->name}");
                $failed++;
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
                $this->error("Failed to create variant for {$plan->name}: " . json_encode($variantData['errors']));
                $failed++;
                continue;
            }

            $variantId = $variantData['data']['id'] ?? null;

            if (!$variantId) {
                $this->error("Variant ID not found for {$plan->name}");
                $failed++;
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

            $this->info("✓ Synced: {$plan->name}");
            $synced++;
        }

        $this->info("\n✓ Synchronization completed!");
        $this->info("Synced: {$synced}, Failed: {$failed}");

        return $failed > 0 ? 1 : 0;
    }
}
