<?php

namespace Tests\Feature\Product;

use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The read-only product sheet: what one checks before selling, ordering or transferring. */
class ProductShowTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;
    private Product $cement;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create(['name' => 'Cocody']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);

        $this->cement = Product::factory()->create([
            'shop_id' => $this->shop->id, 'name' => 'Ciment CPJ 45', 'brand' => 'SOCOCIM', 'sku' => 'CIM-45',
            'selling_price' => 1000, 'purchase_price' => 650, 'average_cost' => 600, 'tax_rate' => 0,
            'stock_quantity' => 40, 'min_stock_alert' => 10, 'track_stock' => true,
        ]);
    }

    private function sheet(?User $as = null): array
    {
        return $this->actingAs($as ?? $this->owner)
            ->get("/{$this->owner->code_user}/produits/{$this->cement->id}")
            ->assertOk()->viewData('page')['props'];
    }

    public function test_the_sheet_shows_price_margin_stock_sales_and_other_shops(): void
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", [
            'shop_id' => $this->shop->id, 'payment_method' => 'cash', 'amount_paid' => 3000,
            'items' => [['product_id' => $this->cement->id, 'quantity' => 3, 'unit_price' => 1000]],
        ])->assertSessionHasNoErrors();

        $yopougon = Shop::factory()->create(['name' => 'Yopougon', 'user_id' => $this->owner->id]);
        Product::factory()->create(['shop_id' => $yopougon->id, 'name' => 'Ciment CPJ 45', 'sku' => 'CIM-45', 'stock_quantity' => 12, 'min_stock_alert' => 5]);

        $props = $this->sheet();

        // Margin on the weighted average cost, not the last purchase price.
        $this->assertEquals(600, $props['pricing']['unit_cost']);
        $this->assertEquals(400, $props['pricing']['unit_margin']);
        $this->assertEquals(40, $props['pricing']['margin_rate']);
        $this->assertSame(37.0, $props['stock']['counter']);
        $this->assertEquals(['quantity' => 3, 'revenue' => 3000, 'margin' => 1200], $props['sales30']);
        $this->assertEquals([['shop' => 'Yopougon', 'stock' => 12, 'min' => 5]], $props['elsewhere']);
        $this->assertSame(-3.0, $props['movements'][0]['quantity']);
        $this->assertTrue($props['canEdit']);
    }

    public function test_someone_who_may_only_view_products_can_open_it_but_not_edit(): void
    {
        $clerk = User::factory()->create(['role' => 'staff', 'shop_id' => $this->shop->id]);
        UserPermission::create(['user_id' => $clerk->id, 'module' => 'products', 'can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => false]);

        $this->assertFalse($this->sheet($clerk)['canEdit']);
        $this->actingAs($clerk)->get("/{$this->owner->code_user}/produits/{$this->cement->id}/edit")->assertForbidden();
    }

    public function test_a_product_of_another_account_cannot_be_opened(): void
    {
        $stranger = Product::factory()->create(['shop_id' => Shop::factory()->create()->id]);

        $this->actingAs($this->owner)->get("/{$this->owner->code_user}/produits/{$stranger->id}")->assertNotFound();
    }
}
