<?php

namespace Tests\Feature\Stock;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\RecurringInvoice;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Invoices moved no stock at all, while the same flow already marked serialised articles
 * as sold — so an invoice touched inventory by halves.
 *
 * Goods leave when the invoice is ISSUED, not when its lines are written: a draft is
 * edited freely and its lines are dropped and recreated on every save, so releasing at
 * creation would decrement on each pass. `stock_released_at` makes the operation
 * idempotent.
 */
class InvoiceStockTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->user->id]);
        $this->actingAs($this->user);
    }

    private function product(int $stock = 100): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'track_stock' => true,
            'stock_quantity' => $stock,
        ]);
    }

    private function invoice(Product $product, string $status, int $quantity = 10, array $attributes = []): Invoice
    {
        $customer = Customer::factory()->create(['shop_id' => $this->shop->id]);

        $invoice = Invoice::create(array_merge([
            'shop_id' => $this->shop->id,
            'customer_id' => $customer->id,
            'user_id' => $this->user->id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => $status,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ], $attributes));

        $invoice->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => $quantity,
            'unit_price' => 100,
            'tax_rate' => 0,
        ]);

        return $invoice->fresh();
    }

    public function test_a_draft_leaves_the_stock_alone(): void
    {
        $product = $this->product(100);
        $invoice = $this->invoice($product, 'draft');

        $invoice->load('items')->releaseStock();

        // Rien n'est sorti : un brouillon n'a rien livré.
        $this->assertSame(100, $product->fresh()->stock_quantity);
    }

    public function test_issuing_an_invoice_takes_the_goods_out(): void
    {
        $product = $this->product(100);
        $invoice = $this->invoice($product, 'sent');

        $invoice->load('items')->releaseStock();

        $this->assertSame(90, $product->fresh()->stock_quantity);
        $this->assertNotNull($invoice->fresh()->stock_released_at);
        $this->assertSame(-10, StockMovement::sum('quantity'));
    }

    /**
     * Issuing then marking paid must not take the goods out twice.
     */
    public function test_releasing_twice_takes_the_goods_out_once(): void
    {
        $product = $this->product(100);
        $invoice = $this->invoice($product, 'sent');

        $invoice->load('items')->releaseStock();
        $invoice->fresh()->load('items')->releaseStock();

        $this->assertSame(90, $product->fresh()->stock_quantity);
        $this->assertSame(1, StockMovement::count());
    }

    /**
     * A recurring invoice rebills a contract every period; decrementing each time would
     * empty the stock of a product that was never delivered.
     */
    public function test_a_recurring_invoice_never_touches_the_stock(): void
    {
        $product = $this->product(100);
        $customer = Customer::factory()->create(['shop_id' => $this->shop->id]);

        $cycle = RecurringInvoice::create([
            'shop_id' => $this->shop->id,
            'customer_id' => $customer->id,
            'user_id' => $this->user->id,
            'invoice_prefix' => 'REC-TEST',
            'subtotal' => 100,
            'tax_amount' => 0,
            'total' => 100,
            'frequency' => 'monthly',
            'start_date' => now()->toDateString(),
            'next_invoice_date' => now()->toDateString(),
            'is_active' => true,
        ]);

        $invoice = $this->invoice($product, 'sent', 10, ['recurring_invoice_id' => $cycle->id]);
        $invoice->load('items')->releaseStock();

        $this->assertSame(100, $product->fresh()->stock_quantity);
        $this->assertNull($invoice->fresh()->stock_released_at);
    }

    public function test_cancelling_an_issued_invoice_puts_the_goods_back(): void
    {
        $product = $this->product(100);
        $invoice = $this->invoice($product, 'sent');
        $invoice->load('items')->releaseStock();

        $this->post("/{$this->user->code_user}/factures/{$invoice->id}/statut", [
            'status' => 'cancelled',
        ])->assertSessionHas('success');

        $this->assertSame(100, $product->fresh()->stock_quantity);
        $this->assertNull($invoice->fresh()->stock_released_at);
        $this->assertSame(0, StockMovement::sum('quantity'));
    }

    /**
     * Cancelling a draft has nothing to give back — and must not invent stock.
     */
    public function test_cancelling_a_draft_gives_nothing_back(): void
    {
        $product = $this->product(100);
        $invoice = $this->invoice($product, 'draft');

        $invoice->load('items.product')->restoreStock();

        $this->assertSame(100, $product->fresh()->stock_quantity);
        $this->assertSame(0, StockMovement::count());
    }

    /**
     * Same guard as a counter sale: the products are locked before the check, so two
     * simultaneous issues of the last piece cannot both pass.
     */
    public function test_issuing_more_than_is_in_stock_is_refused(): void
    {
        $product = $this->product(5);
        $invoice = $this->invoice($product, 'sent', 10);

        try {
            $invoice->load('items')->releaseStock();
            $this->fail('Une facture ne doit pas pouvoir sortir plus que le stock.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            $this->assertStringContainsString('Stock insuffisant', implode(' ', $e->validator->errors()->all()));
        }

        $this->assertSame(5, $product->fresh()->stock_quantity);
        $this->assertNull($invoice->fresh()->stock_released_at);
    }

    public function test_sending_a_draft_releases_its_stock(): void
    {
        \Illuminate\Support\Facades\Mail::fake();

        $product = $this->product(100);
        $invoice = $this->invoice($product, 'draft');

        $this->post("/{$this->user->code_user}/factures/{$invoice->id}/envoyer");

        $this->assertSame(90, $product->fresh()->stock_quantity);
        $this->assertNotNull($invoice->fresh()->stock_released_at);
    }
}
