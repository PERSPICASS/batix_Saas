<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\SubscriptionPlan;
use Tests\TestCase;

class PaddleCheckoutTest extends TestCase
{
    public function test_paddle_checkout_returns_checkout_url()
    {
        // Create a test user
        $user = User::factory()->create();

        // Get a plan
        $plan = SubscriptionPlan::where('slug', 'growth')->first();

        if (!$plan) {
            $this->markTestSkipped('Growth plan not found');
        }

        // Make the request
        $response = $this->actingAs($user)
            ->postJson("/paddle/checkout/{$plan->slug}");

        // Assert response
        $response->assertStatus(200)
            ->assertJsonStructure(['checkout_url']);

        $checkoutUrl = $response->json('checkout_url');

        // Verify the URL structure
        $this->assertStringStartsWith('https://checkout.paddle.com/checkout/price/', $checkoutUrl);
        $this->assertStringContainsString($plan->paddle_price_id, $checkoutUrl);
        $this->assertStringContainsString($user->email, $checkoutUrl);
        $this->assertStringContainsString('success_url=', $checkoutUrl);
        $this->assertStringContainsString('cancel_url=', $checkoutUrl);
    }
}
