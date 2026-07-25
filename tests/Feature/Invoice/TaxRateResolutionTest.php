<?php

namespace Tests\Feature\Invoice;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Where a line's tax rate comes from.
 *
 * Quotes and recurring invoices hardcoded 18 — both on each line and, worse, on the
 * document total (`$subtotal * 0.18`). That ignored the rate configured per shop in
 * Settings and the rate carried by each product: a Moroccan shop at 20%, or a hardware
 * store not registered for VAT at 0%, still got 18% on its quotes. And a quote converts
 * into an invoice, so the wrong rate ended up on a fiscal document.
 *
 * The order matches what SaleCreationService already did at the counter: the product's
 * own rate, then the shop's configured rate, then zero.
 */
class TaxRateResolutionTest extends TestCase
{
    use RefreshDatabase;

    private function owner(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);

        return $user;
    }

    private function postQuote(User $user, Shop $shop, Product $product)
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        return $this->actingAs($user)->post("/{$user->code_user}/devis", [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(30)->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 1000,
            ]],
        ]);
    }

    public function test_a_quote_uses_the_products_own_rate(): void
    {
        $shop = Shop::factory()->create(['default_tax_rate' => 20]);
        $user = $this->owner($shop);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => 7]);

        $this->postQuote($user, $shop, $product)->assertSessionHasNoErrors();

        $quote = Quote::latest('id')->firstOrFail();

        $this->assertSame('7.00', (string) $quote->items->first()->tax_rate);
        // 2 × 1000 × 7% — no longer 18%.
        $this->assertSame('140.00', (string) $quote->tax_amount);
        $this->assertSame('2140.00', (string) $quote->total);
    }

    public function test_a_quote_falls_back_to_the_shops_configured_rate(): void
    {
        $shop = Shop::factory()->create(['default_tax_rate' => 20]);
        $user = $this->owner($shop);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => null]);

        $this->postQuote($user, $shop, $product)->assertSessionHasNoErrors();

        $quote = Quote::latest('id')->firstOrFail();

        $this->assertSame('20.00', (string) $quote->items->first()->tax_rate);
        $this->assertSame('400.00', (string) $quote->tax_amount);
    }

    /**
     * A shop that is not registered for VAT must be charged nothing. This is the case the
     * hardcoded 18 got most wrong: it invented a tax the business does not collect.
     */
    public function test_a_shop_exempt_from_tax_is_charged_nothing(): void
    {
        $shop = Shop::factory()->create(['default_tax_rate' => 0]);
        $user = $this->owner($shop);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => 0]);

        $this->postQuote($user, $shop, $product)->assertSessionHasNoErrors();

        $quote = Quote::latest('id')->firstOrFail();

        $this->assertSame('0.00', (string) $quote->items->first()->tax_rate);
        $this->assertSame('0.00', (string) $quote->tax_amount);
        $this->assertSame('2000.00', (string) $quote->total);
    }

    /**
     * A product explicitly at 0% is an answer, not a missing one: it must not fall
     * through to the shop's rate.
     */
    public function test_a_product_at_zero_does_not_fall_back_to_the_shop(): void
    {
        $shop = Shop::factory()->create(['default_tax_rate' => 20]);
        $user = $this->owner($shop);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => 0]);

        $this->postQuote($user, $shop, $product)->assertSessionHasNoErrors();

        $quote = Quote::latest('id')->firstOrFail();

        $this->assertSame('0.00', (string) $quote->items->first()->tax_rate);
        $this->assertSame('0.00', (string) $quote->tax_amount);
    }

    /**
     * The same rule on the model side, for everything reading a product directly rather
     * than building a document line.
     */
    public function test_the_model_resolves_its_own_effective_rate(): void
    {
        $shop = Shop::factory()->create(['default_tax_rate' => 20]);

        $inherits = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => null]);
        $exempt = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => 0]);
        $own = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => 7]);

        $this->assertSame(20.0, $inherits->effectiveTaxRate());
        $this->assertSame(0.0, $exempt->effectiveTaxRate());
        $this->assertSame(7.0, $own->effectiveTaxRate());
    }

    public function test_a_recurring_invoice_uses_the_configured_rates_too(): void
    {
        $shop = Shop::factory()->create(['default_tax_rate' => 20]);
        $user = $this->owner($shop);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);
        $product = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => null]);

        $this->actingAs($user)->post("/{$user->code_user}/factures-recurrentes", [
            'customer_id' => $customer->id,
            'frequency' => 'monthly',
            'start_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 1000,
            ]],
        ])->assertSessionHasNoErrors();

        $recurring = \App\Models\RecurringInvoice::latest('id')->firstOrFail();

        $this->assertSame('20.00', (string) $recurring->items->first()->tax_rate);
        $this->assertSame('200.00', (string) $recurring->tax_amount);
    }

    /**
     * The document total is summed line by line. A single rate applied to the subtotal
     * stopped being right the moment two lines could differ — which is now the norm.
     */
    public function test_the_quote_total_follows_lines_at_different_rates(): void
    {
        $shop = Shop::factory()->create(['default_tax_rate' => 20]);
        $user = $this->owner($shop);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $taxed = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => 10]);
        $exempt = Product::factory()->create(['shop_id' => $shop->id, 'tax_rate' => 0]);

        $this->actingAs($user)->post("/{$user->code_user}/devis", [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(30)->toDateString(),
            'items' => [
                ['product_id' => $taxed->id, 'quantity' => 1, 'unit_price' => 1000],
                ['product_id' => $exempt->id, 'quantity' => 1, 'unit_price' => 1000],
            ],
        ])->assertSessionHasNoErrors();

        $quote = Quote::latest('id')->firstOrFail();

        // 100 on the taxed line, nothing on the exempt one.
        $this->assertSame('100.00', (string) $quote->tax_amount);
        $this->assertSame('2100.00', (string) $quote->total);
        $this->assertSame('2000.00', (string) $quote->subtotal);
    }
}
