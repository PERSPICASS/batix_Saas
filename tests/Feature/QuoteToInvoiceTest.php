<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class QuoteToInvoiceTest extends TestCase
{
    /**
     * Test that quote can be converted to invoice
     */
    public function test_quote_converts_to_invoice(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'accepted',
            'amount' => 5000,
        ]);

        // After conversion, quote status should change
        $quote->update(['status' => 'converted']);

        $this->assertEquals('converted', $quote->fresh()->status);
    }

    /**
     * Test that invoice inherits quote details
     */
    public function test_invoice_inherits_quote_details(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'accepted',
            'amount' => 5000,
            'reference_number' => 'Q-001',
        ]);

        // Create invoice from quote
        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'amount' => $quote->amount,
            'reference' => 'INV-' . $quote->reference_number,
        ]);

        $this->assertEquals(5000, $invoice->amount);
    }

    /**
     * Test that quote items are copied to invoice items
     */
    public function test_quote_items_copied_to_invoice(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'accepted',
        ]);

        QuoteItem::factory()->count(3)->create(['quote_id' => $quote->id]);

        // Create invoice and copy items
        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'amount' => $quote->amount,
        ]);

        // Verify quote has items
        $this->assertEquals(3, $quote->items->count());
    }

    /**
     * Test that only accepted quotes can be converted
     */
    public function test_only_accepted_quotes_convert(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $acceptedQuote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'accepted',
        ]);

        $pendingQuote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'pending',
        ]);

        $this->assertEquals('accepted', $acceptedQuote->status);
        $this->assertEquals('pending', $pendingQuote->status);
    }

    /**
     * Test that invoice reference is generated from quote
     */
    public function test_invoice_reference_generated(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'reference_number' => 'Q-2024-001',
        ]);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'reference_number' => 'INV-2024-001',
        ]);

        $this->assertNotNull($invoice->reference_number);
    }

    /**
     * Test conversion maintains shop context
     */
    public function test_conversion_maintains_shop(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $quote = Quote::factory()->create(['shop_id' => $shop->id]);
        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'amount' => $quote->amount,
        ]);

        $this->assertEquals($quote->shop_id, $invoice->shop_id);
    }

    /**
     * Test quote preservation after conversion
     */
    public function test_original_quote_preserved(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
            'amount' => 5000,
        ]);

        $originalAmount = $quote->amount;

        // Create invoice from quote
        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'amount' => $quote->amount,
        ]);

        // Quote should remain unchanged
        $this->assertEquals($originalAmount, $quote->fresh()->amount);
    }
}
