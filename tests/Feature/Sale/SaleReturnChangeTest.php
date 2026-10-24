<?php

namespace Tests\Feature\Sale;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Un retour fait baisser le total de la vente : la monnaie à rendre doit suivre,
 * sur la page de la vente comme sur le ticket.
 */
class SaleReturnChangeTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;
    private Sale $sale;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);

        $hammer = Product::factory()->create([
            'shop_id' => $this->shop->id, 'stock_quantity' => 50, 'track_stock' => true, 'tax_rate' => 0, 'selling_price' => 1000,
        ]);

        // 4 × 2 000 = 8 000, payé 10 000 → 2 000 de monnaie.
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", [
            'shop_id' => $this->shop->id,
            'payment_method' => 'cash',
            'amount_paid' => 10000,
            'items' => [['product_id' => $hammer->id, 'quantity' => 4, 'unit_price' => 2000]],
        ]);
        $this->sale = Sale::latest('id')->firstOrFail();
    }

    private function returnItems(int $quantity)
    {
        return $this->actingAs($this->owner)->postJson("/{$this->owner->code_user}/ventes/{$this->sale->id}/retours", [
            'sale_item_id' => $this->sale->items()->firstOrFail()->id,
            'quantity_returned' => $quantity,
            'refund_method' => 'cash',
            'reason' => 'not_satisfied',
        ]);
    }

    public function test_a_return_raises_the_change(): void
    {
        $this->assertEquals(2000, (float) $this->sale->change_amount);

        // Regression: the total went down to 6 000 but the change stayed at 2 000.
        $this->returnItems(1)->assertOk()->assertJsonPath('sale.change_amount', '4000.00');

        $this->assertEquals(6000, (float) $this->sale->fresh()->total);
        $this->assertEquals(4000, (float) $this->sale->fresh()->change_amount);
    }

    public function test_a_return_of_another_account_cannot_be_cancelled(): void
    {
        $this->returnItems(1);

        $other = Shop::factory()->create();
        $intruder = User::factory()->create(['role' => 'super_admin', 'shop_id' => $other->id]);
        $other->update(['user_id' => $intruder->id]);
        $this->subscribeOwnerOf($other);

        $this->actingAs($intruder)
            ->delete("/{$intruder->code_user}/retours/" . SaleReturn::sole()->id)
            ->assertNotFound();

        $this->assertSame(1, SaleReturn::count());
    }

    public function test_cancelling_the_return_brings_the_change_back(): void
    {
        $this->returnItems(1);

        // Regression: SaleReturn's route binding filtered on returns.shop_id, a column
        // that does not exist, so cancelling any return was a 500.
        $this->actingAs($this->owner)
            ->from("/{$this->owner->code_user}/ventes/{$this->sale->id}")
            ->delete("/{$this->owner->code_user}/retours/" . SaleReturn::sole()->id)
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertEquals(8000, (float) $this->sale->fresh()->total);
        $this->assertEquals(2000, (float) $this->sale->fresh()->change_amount);
    }

    /** A fresh 2 × 1 000 sale, with the given product tax rate and sale attributes. */
    private function saleOfTwo(int $taxRate, array $attrs = []): Sale
    {
        $product = Product::factory()->create([
            'shop_id' => $this->shop->id, 'stock_quantity' => 50, 'track_stock' => true, 'tax_rate' => $taxRate, 'selling_price' => 1000,
        ]);
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", array_merge([
            'shop_id' => $this->shop->id,
            'payment_method' => 'cash',
            'amount_paid' => 5000,
            'items' => [['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 1000]],
        ], $attrs));

        return $this->sale = Sale::latest('id')->firstOrFail();
    }

    public function test_the_refund_includes_the_vat(): void
    {
        // Regression: the refund was unit price × quantity (1 000), while the
        // customer had paid 1 180 for that item — the total did drop by 1 180.
        $sale = $this->saleOfTwo(18);
        $this->assertEquals(2360, (float) $sale->total);

        $this->returnItems(1)->assertOk()->assertJsonPath('message', fn ($m) => str_contains($m, '1 180'));

        $this->assertEquals(1180, (float) SaleReturn::sole()->refund_amount);
        $this->assertEquals(1180, (float) $sale->fresh()->total);
    }

    public function test_the_refund_takes_the_discount_off(): void
    {
        // With a 10 % discount the item cost 900: refunding 1 000 gave 100 away.
        $sale = $this->saleOfTwo(0, ['discount_amount' => 200]);
        $this->assertEquals(1800, (float) $sale->total);

        $this->returnItems(1)->assertOk();

        $this->assertEquals(900, (float) SaleReturn::sole()->refund_amount);
        $this->assertEquals(900, (float) $sale->fresh()->total);
    }
}
