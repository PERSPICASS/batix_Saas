<?php

namespace Tests\Feature\Sale;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le cycle de vie d'une vente au comptoir : création (totaux, taxe, remise, sortie
 * de stock), annulation, réactivation et encaissement d'un crédit. C'est là que
 * passe l'argent des clients, et rien ne le couvrait.
 */
class SaleLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    private function product(array $attrs = []): Product
    {
        return Product::factory()->create(array_merge([
            'shop_id' => $this->shop->id,
            'stock_quantity' => 50,
            'track_stock' => true,
            'tax_rate' => 0,
            'selling_price' => 1000,
        ], $attrs));
    }

    private function sell(array $items, array $attrs = [], ?User $as = null)
    {
        return $this->actingAs($as ?? $this->owner)->post("/{$this->owner->code_user}/ventes", array_merge([
            'shop_id' => $this->shop->id,
            'payment_method' => 'cash',
            'amount_paid' => 0,
            'items' => $items,
        ], $attrs));
    }

    private function lastSale(): Sale
    {
        return Sale::latest('id')->firstOrFail();
    }

    // --- Création ---------------------------------------------------------------

    public function test_a_paid_sale_computes_its_totals_and_takes_the_goods_out(): void
    {
        $cement = $this->product(['tax_rate' => 18]);

        $this->sell([['product_id' => $cement->id, 'quantity' => 3, 'unit_price' => 1000]], ['amount_paid' => 5000])
            ->assertRedirect();

        $sale = $this->lastSale();
        $this->assertEquals(3000, (float) $sale->subtotal);
        $this->assertEquals(540, (float) $sale->tax_amount);
        $this->assertEquals(3540, (float) $sale->total);
        $this->assertEquals(1460, (float) $sale->change_amount);
        $this->assertEquals(0, (float) $sale->remaining_amount);
        $this->assertSame('completed', $sale->status);
        $this->assertSame(47, $cement->fresh()->stock_quantity);
    }

    /** La remise réduit la base imposable, elle ne se retranche pas du TTC. */
    public function test_a_discount_reduces_the_taxable_base(): void
    {
        $cement = $this->product(['tax_rate' => 18]);

        $this->sell([['product_id' => $cement->id, 'quantity' => 10, 'unit_price' => 1000]], [
            'discount_amount' => 1000,
            'amount_paid' => 10620,
        ]);

        $sale = $this->lastSale();
        $this->assertEquals(1000, (float) $sale->discount_amount);
        $this->assertEquals(1620, (float) $sale->tax_amount);
        $this->assertEquals(10620, (float) $sale->total);
        $this->assertEquals(0, (float) $sale->change_amount);
        $this->assertEquals(0, (float) $sale->remaining_amount);
        $this->assertSame('completed', $sale->status);
    }

    /** Deux lignes à des taux différents : chaque base est réduite dans la même proportion. */
    public function test_a_discount_is_spread_over_lines_with_different_rates(): void
    {
        $taxed = $this->product(['tax_rate' => 18]);
        $exempt = $this->product(['tax_rate' => 0]);

        $this->sell([
            ['product_id' => $taxed->id, 'quantity' => 1, 'unit_price' => 6000],
            ['product_id' => $exempt->id, 'quantity' => 1, 'unit_price' => 4000],
        ], ['discount_amount' => 1000, 'amount_paid' => 0]);

        $sale = $this->lastSale();
        // 18 % de 6 000 = 1 080, réduit de 10 % → 972 ; total 9 000 + 972.
        $this->assertEquals(972, (float) $sale->tax_amount);
        $this->assertEquals(9972, (float) $sale->total);
        $this->assertEquals(9972, (float) $sale->remaining_amount);
    }

    public function test_a_discount_larger_than_the_sale_is_capped(): void
    {
        $cement = $this->product();

        $this->sell([['product_id' => $cement->id, 'quantity' => 1, 'unit_price' => 1000]], ['discount_amount' => 5000]);

        $sale = $this->lastSale();
        $this->assertEquals(1000, (float) $sale->discount_amount);
        $this->assertEquals(0, (float) $sale->total);
    }

    public function test_an_unpaid_balance_makes_a_credit_sale(): void
    {
        $cement = $this->product();
        $customer = Customer::factory()->create(['shop_id' => $this->shop->id]);

        $this->sell([['product_id' => $cement->id, 'quantity' => 5, 'unit_price' => 1000]], [
            'payment_method' => 'credit',
            'amount_paid' => 2000,
            'customer_id' => $customer->id,
            'credit_due_date' => now()->addWeek()->toDateString(),
        ]);

        $sale = $this->lastSale();
        $this->assertSame('pending', $sale->status);
        $this->assertEquals(3000, (float) $sale->remaining_amount);
        $this->assertNotNull($sale->credit_due_date);
    }

    public function test_a_due_date_is_dropped_once_the_sale_is_paid_in_full(): void
    {
        $cement = $this->product();

        $this->sell([['product_id' => $cement->id, 'quantity' => 1, 'unit_price' => 1000]], [
            'amount_paid' => 1000,
            'credit_due_date' => now()->addWeek()->toDateString(),
        ]);

        $this->assertNull($this->lastSale()->credit_due_date);
    }

    /** Deux lignes du même produit se cumulent pour le contrôle de stock. */
    public function test_two_lines_of_one_product_cannot_together_exceed_the_stock(): void
    {
        $cement = $this->product(['stock_quantity' => 5]);

        $this->sell([
            ['product_id' => $cement->id, 'quantity' => 3, 'unit_price' => 1000],
            ['product_id' => $cement->id, 'quantity' => 3, 'unit_price' => 1000],
        ])->assertSessionHasErrors('items');

        $this->assertSame(0, Sale::count());
        $this->assertSame(5, $cement->fresh()->stock_quantity);
    }

    public function test_selling_more_than_the_stock_is_refused_and_writes_nothing(): void
    {
        $cement = $this->product(['stock_quantity' => 2]);

        $this->sell([['product_id' => $cement->id, 'quantity' => 3, 'unit_price' => 1000]])
            ->assertSessionHasErrors('items');

        $this->assertSame(0, Sale::count());
        $this->assertSame(2, $cement->fresh()->stock_quantity);
    }

    public function test_a_product_without_stock_tracking_sells_freely(): void
    {
        $service = $this->product(['track_stock' => false, 'stock_quantity' => 0]);

        $this->sell([['product_id' => $service->id, 'quantity' => 4, 'unit_price' => 500]], ['amount_paid' => 2000]);

        $this->assertSame('completed', $this->lastSale()->status);
        $this->assertSame(0, $service->fresh()->stock_quantity);
    }

    // --- Annulation et réactivation ----------------------------------------------

    private function cancel(Sale $sale, ?User $as = null)
    {
        return $this->actingAs($as ?? $this->owner)->delete("/{$this->owner->code_user}/ventes/{$sale->id}");
    }

    private function restore(Sale $sale)
    {
        return $this->actingAs($this->owner)->patch("/{$this->owner->code_user}/ventes/{$sale->id}/reactiver");
    }

    public function test_cancelling_puts_the_goods_back_once(): void
    {
        $cement = $this->product();
        $this->sell([['product_id' => $cement->id, 'quantity' => 4, 'unit_price' => 1000]], ['amount_paid' => 4000]);
        $sale = $this->lastSale();

        $this->cancel($sale);
        $this->cancel($sale)->assertSessionHas('error');

        $this->assertSame('cancelled', $sale->fresh()->status);
        $this->assertSame(50, $cement->fresh()->stock_quantity);
    }

    /** Les unités retournées sont déjà revenues en stock : les y remettre une 2ᵉ fois gonflait le stock. */
    public function test_a_sale_with_returns_cannot_be_cancelled(): void
    {
        $cement = $this->product();
        $this->sell([['product_id' => $cement->id, 'quantity' => 4, 'unit_price' => 1000]], ['amount_paid' => 4000]);
        $sale = $this->lastSale();
        SaleReturn::create([
            'sale_id' => $sale->id,
            'sale_item_id' => $sale->items()->first()->id,
            'user_id' => $this->owner->id,
            'quantity_returned' => 1,
            'refund_amount' => 1000,
            'refund_method' => 'cash',
            'reason' => 'defective',
        ]);
        $stockBefore = $cement->fresh()->stock_quantity;

        $this->cancel($sale)->assertSessionHas('error');

        $this->assertNotSame('cancelled', $sale->fresh()->status);
        $this->assertSame($stockBefore, $cement->fresh()->stock_quantity);
    }

    public function test_a_cashier_cannot_cancel_a_sale(): void
    {
        $cement = $this->product();
        $this->sell([['product_id' => $cement->id, 'quantity' => 1, 'unit_price' => 1000]], ['amount_paid' => 1000]);
        $cashier = User::factory()->create(['role' => 'cashier', 'shop_id' => $this->shop->id]);

        $this->cancel($this->lastSale(), $cashier);

        $this->assertSame('completed', $this->lastSale()->status);
        $this->assertSame(49, $cement->fresh()->stock_quantity);
    }

    public function test_restoring_takes_the_goods_out_again(): void
    {
        $cement = $this->product();
        $this->sell([['product_id' => $cement->id, 'quantity' => 4, 'unit_price' => 1000]], ['amount_paid' => 4000]);
        $sale = $this->lastSale();
        $this->cancel($sale);

        $this->restore($sale);

        $this->assertSame('completed', $sale->fresh()->status);
        $this->assertSame(46, $cement->fresh()->stock_quantity);
    }

    public function test_restoring_is_refused_when_the_stock_has_gone_since(): void
    {
        $cement = $this->product(['stock_quantity' => 4]);
        $this->sell([['product_id' => $cement->id, 'quantity' => 4, 'unit_price' => 1000]], ['amount_paid' => 4000]);
        $sale = $this->lastSale();
        $this->cancel($sale);
        $this->sell([['product_id' => $cement->id, 'quantity' => 3, 'unit_price' => 1000]], ['amount_paid' => 3000]);

        $this->restore($sale)->assertSessionHas('error');

        $this->assertSame('cancelled', $sale->fresh()->status);
        $this->assertSame(1, $cement->fresh()->stock_quantity);
    }

    /** Réactivée, une vente à crédit passait en « completed » avec un reste dû. */
    public function test_a_restored_credit_sale_is_still_unpaid(): void
    {
        $cement = $this->product();
        $this->sell([['product_id' => $cement->id, 'quantity' => 5, 'unit_price' => 1000]], [
            'payment_method' => 'credit',
            'amount_paid' => 1000,
        ]);
        $sale = $this->lastSale();
        $this->cancel($sale);

        $this->restore($sale);

        $this->assertSame('pending', $sale->fresh()->status);
    }

    // --- Encaissement d'un crédit ------------------------------------------------

    private function creditSale(float $total = 5000, float $paid = 1000): Sale
    {
        $cement = $this->product();
        $this->sell([['product_id' => $cement->id, 'quantity' => (int) ($total / 1000), 'unit_price' => 1000]], [
            'payment_method' => 'credit',
            'amount_paid' => $paid,
        ]);

        return $this->lastSale();
    }

    private function payCredit(Sale $sale, float $amount)
    {
        return $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes/{$sale->id}/pay-credit", [
            'payment_amount' => $amount,
            'payment_method' => 'cash',
        ]);
    }

    public function test_a_partial_payment_lowers_the_balance(): void
    {
        $sale = $this->creditSale();

        $this->payCredit($sale, 1500)->assertSessionHas('success');

        $sale->refresh();
        $this->assertEquals(2500, (float) $sale->remaining_amount);
        $this->assertEquals(2500, (float) $sale->amount_paid);
        $this->assertSame('pending', $sale->status);
    }

    public function test_paying_the_balance_settles_the_sale(): void
    {
        $sale = $this->creditSale();

        $this->payCredit($sale, 4000);

        $sale->refresh();
        $this->assertEquals(0, (float) $sale->remaining_amount);
        $this->assertSame('completed', $sale->status);
    }

    public function test_paying_more_than_is_due_is_refused(): void
    {
        $sale = $this->creditSale();

        $this->payCredit($sale, 4001)->assertSessionHas('error');

        $this->assertEquals(4000, (float) $sale->fresh()->remaining_amount);
    }

    /** Une vente annulée garde son reste dû en base, mais il n'est plus dû. */
    public function test_no_payment_can_be_recorded_on_a_cancelled_sale(): void
    {
        $sale = $this->creditSale();
        $this->cancel($sale);

        $this->payCredit($sale, 1000)->assertSessionHas('error');

        $this->assertEquals(1000, (float) $sale->fresh()->amount_paid);
    }
}
