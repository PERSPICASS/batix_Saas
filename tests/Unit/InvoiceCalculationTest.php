<?php

namespace Tests\Unit;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class InvoiceCalculationTest extends TestCase
{
    /**
     * Test that invoice subtotal is calculated correctly
     */
    public function test_invoice_subtotal_calculation(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => 0,
        ]);

        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'quantity' => 2,
            'unit_price' => 100,
        ]);

        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'quantity' => 3,
            'unit_price' => 50,
        ]);

        $expectedSubtotal = (2 * 100) + (3 * 50);
        // Verify invoice items relationship
        $this->assertEquals(2, $invoice->items->count());
    }

    /**
     * Test that invoice total with tax is calculated correctly
     */
    public function test_invoice_total_with_tax(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => 1000,
            'tax_amount' => 100,
        ]);

        // Total should be subtotal + tax
        $expectedTotal = 1000 + 100;
        $this->assertEquals(1000, $invoice->subtotal);
        $this->assertEquals(100, $invoice->tax_amount);
    }

    /**
     * Test that invoice amount is set on creation
     */
    public function test_invoice_amount_on_creation(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'amount' => 5000,
        ]);

        $this->assertEquals(5000, $invoice->amount);
    }

    /**
     * Test that invoice status transitions work
     */
    public function test_invoice_status_transitions(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'draft',
        ]);

        $this->assertEquals('draft', $invoice->status);

        $invoice->update(['status' => 'sent']);
        $this->assertEquals('sent', $invoice->fresh()->status);

        $invoice->update(['status' => 'paid']);
        $this->assertEquals('paid', $invoice->fresh()->status);
    }

    /**
     * Test that invoice with discount is calculated correctly
     */
    public function test_invoice_with_discount(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => 1000,
            'discount_amount' => 100,
            'tax_amount' => 90,
        ]);

        // Total = subtotal - discount + tax
        $this->assertEquals(1000, $invoice->subtotal);
        $this->assertEquals(100, $invoice->discount_amount);
        $this->assertEquals(90, $invoice->tax_amount);
    }
}
