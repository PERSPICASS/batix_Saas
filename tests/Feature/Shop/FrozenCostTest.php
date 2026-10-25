<?php

namespace Tests\Feature\Shop;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use App\Services\ShopsOverview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The cost of an item is frozen when it is sold or invoiced. Margins used the product's
 * current cost, so a purchase at a new price rewrote the margin of every past sale.
 */
class FrozenCostTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;
    private Product $hammer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);

        $this->hammer = Product::factory()->create([
            'shop_id' => $this->shop->id, 'stock_quantity' => 100, 'track_stock' => true, 'tax_rate' => 0,
            'selling_price' => 1000, 'purchase_price' => 500, 'average_cost' => 600,
        ]);
    }

    private function margin(): float
    {
        return app(ShopsOverview::class)->figures(collect([$this->shop->fresh()]), now()->startOfMonth(), now()->endOfMonth(), withSnapshot: false)[$this->shop->id]['gross_margin'];
    }

    public function test_a_past_sale_keeps_its_margin_when_the_cost_moves(): void
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", [
            'shop_id' => $this->shop->id, 'payment_method' => 'cash', 'amount_paid' => 2000,
            'items' => [['product_id' => $this->hammer->id, 'quantity' => 2, 'unit_price' => 1000]],
        ])->assertSessionHasNoErrors();

        $this->assertEquals(600, (float) Sale::sole()->items()->sole()->unit_cost);
        $this->assertEquals(800, $this->margin()); // 2 000 - 2 × 600

        // A dearer purchase lifts the weighted average to 900.
        $this->hammer->update(['average_cost' => 900]);

        $this->assertEquals(800, $this->margin());
    }

    public function test_an_invoiced_line_freezes_its_cost_too(): void
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/factures", [
            'shop_id' => $this->shop->id,
            'customer_id' => Customer::factory()->create(['shop_id' => $this->shop->id])->id,
            'invoice_date' => now()->toDateString(), 'status' => 'sent',
            'items' => [['product_id' => $this->hammer->id, 'product_name' => 'Marteau', 'quantity' => 3, 'unit_price' => 1000]],
        ])->assertSessionHasNoErrors();

        $this->assertEquals(600, (float) Invoice::sole()->items()->sole()->unit_cost);
        $this->hammer->update(['average_cost' => 900]);

        $this->assertEquals(1200, $this->margin()); // 3 000 - 3 × 600, not 3 × 900
    }
}
