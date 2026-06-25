<?php

namespace App\Console\Commands;

use App\Models\LemonSqueezyProduct;
use App\Models\SubscriptionPlan;
use Illuminate\Console\Command;

class LinkLemonSqueezyProducts extends Command
{
    protected $signature = 'lemonsqueezy:link-products';

    protected $description = 'Link existing LemonSqueezy products to subscription plans';

    public function handle(): int
    {
        $this->info('=== Linking LemonSqueezy Products ===');
        $this->line('');

        $plans = SubscriptionPlan::where('is_active', true)->get();

        if ($plans->isEmpty()) {
            $this->error('No active subscription plans found.');
            return 1;
        }

        $this->info("Found {$plans->count()} active plans:");
        foreach ($plans as $plan) {
            $this->line("  - {$plan->id}: {$plan->name} ({$plan->price} EUR)");
        }

        $this->line('');
        $this->info('For each plan, enter the LemonSqueezy product and variant IDs.');
        $this->line('You can find these in your LemonSqueezy Dashboard → Products');
        $this->line('');

        $linked = 0;
        $failed = 0;

        foreach ($plans as $plan) {
            $this->line('');
            $this->info("Setting up: {$plan->name}");

            $productId = $this->ask("  Product ID for {$plan->name}");
            if (!$productId) {
                $this->warn("  Skipped");
                $failed++;
                continue;
            }

            $variantId = $this->ask("  Variant ID for {$plan->name}");
            if (!$variantId) {
                $this->warn("  Skipped");
                $failed++;
                continue;
            }

            try {
                LemonSqueezyProduct::updateOrCreate(
                    ['subscription_plan_id' => $plan->id],
                    [
                        'lemon_product_id' => $productId,
                        'lemon_variant_id' => $variantId,
                        'name' => $plan->name,
                        'description' => $plan->description,
                        'price' => $plan->price,
                        'currency' => 'EUR',
                    ]
                );

                $this->info("  ✓ Linked!");
                $linked++;
            } catch (\Exception $e) {
                $this->error("  ✗ Error: " . $e->getMessage());
                $failed++;
            }
        }

        $this->line('');
        $this->info("✓ Done!");
        $this->line("Linked: {$linked}, Failed: {$failed}");

        return $failed > 0 ? 1 : 0;
    }
}
