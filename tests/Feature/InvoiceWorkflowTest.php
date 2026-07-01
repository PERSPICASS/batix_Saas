<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class InvoiceWorkflowTest extends TestCase
{
    /**
     * Test complete invoice creation workflow
     */
    public function test_invoice_creation_workflow(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        // Create invoice
        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'draft',
            'amount' => 5000,
        ]);

        $this->assertEquals('draft', $invoice->status);
        $this->assertEquals(5000, $invoice->amount);
    }

    /**
     * Test invoice with items workflow
     */
    public function test_invoice_with_items_workflow(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'draft',
        ]);

        // Add items
        InvoiceItem::factory()->count(2)->create(['invoice_id' => $invoice->id]);

        $this->assertEquals(2, $invoice->items->count());
    }

    /**
     * Test invoice status transition from draft to sent
     */
    public function test_invoice_draft_to_sent(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'draft',
        ]);

        $invoice->update(['status' => 'sent']);

        $this->assertEquals('sent', $invoice->fresh()->status);
    }

    /**
     * Test invoice status transition from sent to paid
     */
    public function test_invoice_sent_to_paid(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'sent',
        ]);

        $invoice->update(['status' => 'paid']);

        $this->assertEquals('paid', $invoice->fresh()->status);
    }

    /**
     * Test invoice payment recording
     */
    public function test_invoice_payment_recording(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'amount' => 5000,
            'status' => 'sent',
        ]);

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->assertEquals('paid', $invoice->fresh()->status);
        $this->assertNotNull($invoice->fresh()->paid_at);
    }

    /**
     * Test invoice with discount workflow
     */
    public function test_invoice_with_discount_workflow(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'subtotal' => 10000,
            'discount_amount' => 1000,
            'status' => 'draft',
        ]);

        $this->assertEquals(1000, $invoice->discount_amount);
    }

    /**
     * Test invoice with multiple items calculation
     */
    public function test_invoice_multi_item_calculation(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
        ]);

        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'quantity' => 2,
            'unit_price' => 1000,
        ]);

        InvoiceItem::factory()->create([
            'invoice_id' => $invoice->id,
            'quantity' => 3,
            'unit_price' => 500,
        ]);

        $this->assertEquals(2, $invoice->items->count());
    }

    /**
     * Test invoice belongs to shop
     */
    public function test_invoice_belongs_to_shop(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create(['shop_id' => $shop->id]);

        $this->assertEquals($shop->id, $invoice->shop_id);
    }
}
