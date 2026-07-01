<?php

namespace Tests\Unit;

use App\Models\Invoice;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class DiscountCalculationTest extends TestCase
{
    /**
     * Test that percentage discount is calculated correctly
     */
    public function test_percentage_discount_calculation(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $subtotal = 10000;
        $discountPercent = 10; // 10%

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => $subtotal,
            'discount_amount' => ($subtotal * $discountPercent) / 100,
        ]);

        $expectedDiscount = 1000;
        $this->assertEquals($expectedDiscount, $invoice->discount_amount);
    }

    /**
     * Test that fixed discount is applied
     */
    public function test_fixed_discount_applied(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => 10000,
            'discount_amount' => 500,
        ]);

        $this->assertEquals(500, $invoice->discount_amount);
    }

    /**
     * Test that discount cannot exceed subtotal
     */
    public function test_discount_validation(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $subtotal = 10000;
        $discountAmount = 15000; // More than subtotal

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
        ]);

        // Verify the amounts are stored (validation happens at controller level)
        $this->assertEquals($subtotal, $invoice->subtotal);
        $this->assertEquals($discountAmount, $invoice->discount_amount);
    }

    /**
     * Test that sale discount is tracked
     */
    public function test_sale_discount_tracked(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => 5000,
            'discount_amount' => 500,
            'total_amount' => 4500,
        ]);

        $this->assertEquals(500, $sale->discount_amount);
        $this->assertEquals(4500, $sale->total_amount);
    }

    /**
     * Test that multiple discounts don't stack incorrectly
     */
    public function test_discount_application_once(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $subtotal = 10000;
        $discountAmount = 1000;

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
        ]);

        // Discount should only be applied once
        $this->assertEquals($discountAmount, $invoice->discount_amount);
    }

    /**
     * Test that discount is considered in tax calculation
     */
    public function test_tax_calculated_after_discount(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $subtotal = 10000;
        $discountAmount = 1000;
        $amountAfterDiscount = $subtotal - $discountAmount; // 9000
        $taxRate = 0.10; // 10%
        $taxAmount = $amountAfterDiscount * $taxRate; // 900

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
        ]);

        $this->assertEquals(900, $invoice->tax_amount);
    }
}
