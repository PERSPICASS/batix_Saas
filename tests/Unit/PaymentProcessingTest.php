<?php

namespace Tests\Unit;

use App\Models\Invoice;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class PaymentProcessingTest extends TestCase
{
    /**
     * Test that sale payment status is initialized
     */
    public function test_sale_payment_status_initialized(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'payment_status' => 'pending',
        ]);

        $this->assertEquals('pending', $sale->payment_status);
    }

    /**
     * Test that sale can be marked as paid
     */
    public function test_sale_can_be_marked_paid(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'payment_status' => 'pending',
            'amount_paid' => 0,
        ]);

        $sale->update([
            'payment_status' => 'paid',
            'amount_paid' => $sale->total_amount,
        ]);

        $this->assertEquals('paid', $sale->fresh()->payment_status);
    }

    /**
     * Test that partial payment is tracked
     */
    public function test_partial_payment_tracking(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'total_amount' => 10000,
            'amount_paid' => 5000,
        ]);

        $this->assertEquals(10000, $sale->total_amount);
        $this->assertEquals(5000, $sale->amount_paid);
    }

    /**
     * Test that invoice payment is recorded
     */
    public function test_invoice_payment_recorded(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'amount' => 5000,
            'status' => 'draft',
        ]);

        $invoice->update(['status' => 'paid']);

        $this->assertEquals('paid', $invoice->fresh()->status);
    }

    /**
     * Test that payment method is stored
     */
    public function test_payment_method_stored(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'payment_method' => 'cash',
        ]);

        $this->assertEquals('cash', $sale->payment_method);
    }

    /**
     * Test that payment date is recorded
     */
    public function test_payment_date_recorded(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $paymentDate = now();
        $sale = Sale::factory()->create([
            'shop_id' => $shop->id,
            'payment_date' => $paymentDate,
        ]);

        $this->assertNotNull($sale->payment_date);
    }
}
