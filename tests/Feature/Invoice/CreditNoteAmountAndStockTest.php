<?php

namespace Tests\Feature\Invoice;

use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A credit note credits what was billed — line discount and its share of the invoice
 * discount deducted — and, when the goods come back, puts them back in stock. It used to
 * credit the catalogue price (more than billed, more than the FNE-certified credit note)
 * and never touched the stock.
 */
class CreditNoteAmountAndStockTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;
    private Product $cement;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);

        $this->cement = Product::factory()->create([
            'shop_id' => $this->shop->id, 'stock_quantity' => 50, 'track_stock' => true, 'tax_rate' => 18, 'selling_price' => 1000,
        ]);
    }

    /** 10 × 1 000 HT, 500 off the line, then 950 off the invoice (10 %), VAT 18 %. */
    private function discountedInvoice(string $status = 'sent'): Invoice
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/factures", [
            'shop_id' => $this->shop->id,
            'customer_id' => Customer::factory()->create(['shop_id' => $this->shop->id])->id,
            'invoice_date' => now()->toDateString(),
            'status' => $status,
            'discount_amount' => 950,
            'items' => [[
                'product_id' => $this->cement->id, 'product_name' => 'Ciment', 'quantity' => 10,
                'unit_price' => 1000, 'tax_rate' => 18, 'discount_amount' => 500,
            ]],
        ])->assertSessionHasNoErrors();

        return Invoice::latest('id')->firstOrFail();
    }

    private function credit(Invoice $invoice, int $quantity, bool $restock = true)
    {
        return $this->actingAs($this->owner)->post("/{$this->owner->code_user}/factures/{$invoice->id}/avoir", [
            'reason' => 'Retour', 'restock' => $restock,
            'items' => [['invoice_item_id' => $invoice->items()->sole()->id, 'quantity' => $quantity]],
        ]);
    }

    public function test_a_credit_note_credits_the_billed_price_not_the_catalogue_price(): void
    {
        $invoice = $this->discountedInvoice();
        // HT 9 500 - 950 = 8 550, VAT 1 539, total 10 089.
        $this->assertEquals(10089, (float) $invoice->total);

        $this->credit($invoice, 2)->assertSessionHasNoErrors();

        // One unit was billed 8 550 / 10 = 855 HT: two are 1 710 HT + 18 % = 2 017,80.
        // It used to credit 2 × 1 000 + 18 % = 2 360.
        $note = CreditNote::sole();
        $this->assertEquals(855, (float) $note->items()->sole()->unit_price);
        $this->assertEquals(1710, (float) $note->subtotal);
        $this->assertEquals(2017.8, (float) $note->total);
    }

    public function test_crediting_the_whole_invoice_brings_it_to_zero_not_below(): void
    {
        $invoice = $this->discountedInvoice();

        $this->credit($invoice, 10)->assertSessionHasNoErrors();

        $this->assertEqualsWithDelta(0, $invoice->fresh()->netTotal(), 0.01);
    }

    public function test_the_goods_go_back_in_stock_when_asked(): void
    {
        $invoice = $this->discountedInvoice();
        $this->assertSame(40, $this->cement->fresh()->stock_quantity);

        $this->credit($invoice, 3)->assertSessionHasNoErrors();

        $this->assertSame(43, $this->cement->fresh()->stock_quantity);
        $this->assertTrue(CreditNote::sole()->restocked);
        $movement = StockMovement::where('reference_type', 'CreditNote')->sole();
        $this->assertSame(3, $movement->quantity);
        $this->assertSame('return', $movement->type);
    }

    public function test_a_price_correction_leaves_the_stock_alone(): void
    {
        $invoice = $this->discountedInvoice();

        $this->credit($invoice, 3, restock: false)->assertSessionHasNoErrors();

        $this->assertSame(40, $this->cement->fresh()->stock_quantity);
        $this->assertFalse(CreditNote::sole()->restocked);
    }

    public function test_nothing_goes_back_if_the_invoice_never_took_anything_out(): void
    {
        $invoice = $this->discountedInvoice();
        // As for an invoice whose stock was never released (e.g. a recurring one).
        $invoice->forceFill(['stock_released_at' => null])->save();
        $this->cement->update(['stock_quantity' => 40]);

        $this->credit($invoice, 3, restock: true)->assertSessionHasNoErrors();

        $this->assertSame(40, $this->cement->fresh()->stock_quantity);
        $this->assertFalse(CreditNote::sole()->restocked);
    }
}
