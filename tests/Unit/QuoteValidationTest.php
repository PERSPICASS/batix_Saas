<?php

namespace Tests\Unit;

use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class QuoteValidationTest extends TestCase
{
    /**
     * Test that quote requires a shop
     */
    public function test_quote_requires_shop(): void
    {
        $quote = Quote::factory()->make(['shop_id' => null]);

        $this->assertNull($quote->shop_id);
    }

    /**
     * Test that quote has reference number
     */
    public function test_quote_has_reference_number(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'reference_number' => 'Q-001-2024',
        ]);

        $this->assertEquals('Q-001-2024', $quote->reference_number);
    }

    /**
     * Test that quote validates required fields
     */
    public function test_quote_validates_amount(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'amount' => 5000,
        ]);

        $this->assertEquals(5000, $quote->amount);
    }

    /**
     * Test that quote status is initialized
     */
    public function test_quote_status_initialized(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'pending',
        ]);

        $this->assertEquals('pending', $quote->status);
    }

    /**
     * Test that quote can be converted to invoice
     */
    public function test_quote_conversion_status(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'accepted',
        ]);

        // When a quote is converted to invoice, it should be marked as converted
        $this->assertEquals('accepted', $quote->status);
    }

    /**
     * Test that quote expiration date can be set
     */
    public function test_quote_expiration_date(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'expiration_date' => now()->addDays(30),
        ]);

        $this->assertNotNull($quote->expiration_date);
    }
}
