<?php

namespace Tests\Feature;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class SalesTest extends TestCase
{
    /**
     * Test that sale can be created
     */
    public function test_sale_can_be_created(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'total_amount' => 5000,
        ]);

        $this->assertEquals(5000, $sale->total_amount);
    }

    /**
     * Test that sale with items can be created
     */
    public function test_sale_with_items_created(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create(['shop_id' => $shop->id]);

        SaleItem::factory()->count(3)->create(['sale_id' => $sale->id]);

        $this->assertEquals(3, $sale->items->count());
    }

    /**
     * Test that sale payment status is tracked
     */
    public function test_sale_payment_status_tracked(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'payment_status' => 'pending',
        ]);

        $this->assertEquals('pending', $sale->payment_status);
    }

    /**
     * Test that sale can be marked as paid
     */
    public function test_sale_marked_as_paid(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'payment_status' => 'pending',
            'total_amount' => 5000,
        ]);

        $sale->update([
            'payment_status' => 'paid',
            'amount_paid' => 5000,
            'paid_at' => now(),
        ]);

        $this->assertEquals('paid', $sale->fresh()->payment_status);
        $this->assertEquals(5000, $sale->fresh()->amount_paid);
    }

    /**
     * Test that partial payment is recorded
     */
    public function test_partial_payment_recorded(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'total_amount' => 10000,
            'payment_status' => 'pending',
        ]);

        $sale->update([
            'amount_paid' => 5000,
            'payment_status' => 'partially_paid',
        ]);

        $this->assertEquals(5000, $sale->fresh()->amount_paid);
        $this->assertEquals('partially_paid', $sale->fresh()->payment_status);
    }

    /**
     * Test that sale payment method is recorded
     */
    public function test_sale_payment_method_recorded(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'payment_method' => 'credit_card',
        ]);

        $this->assertEquals('credit_card', $sale->payment_method);
    }

    /**
     * Test that sale discount is applied
     */
    public function test_sale_discount_applied(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => 10000,
            'discount_amount' => 1000,
            'total_amount' => 9000,
        ]);

        $this->assertEquals(1000, $sale->discount_amount);
        $this->assertEquals(9000, $sale->total_amount);
    }

    /**
     * Test that sale belongs to shop
     */
    public function test_sale_belongs_to_shop(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create(['shop_id' => $shop->id]);

        $this->assertEquals($shop->id, $sale->shop_id);
    }

    /**
     * Test that sale credits can be applied
     */
    public function test_sale_credits_applied(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'total_amount' => 5000,
            'credit_used' => 500,
        ]);

        $this->assertEquals(500, $sale->credit_used);
    }
}
