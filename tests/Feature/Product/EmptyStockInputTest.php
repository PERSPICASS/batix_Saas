<?php

namespace Tests\Feature\Product;

use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le champ « Quantité en stock » peut maintenant rester vide : à la création il démarrait
 * à '0', en modification Number('') y remettait un 0 qu'on ne pouvait pas effacer. Le
 * formulaire compte sur ces deux règles du serveur.
 */
class EmptyStockInputTest extends TestCase
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

    public function test_an_empty_stock_creates_the_product_with_zero(): void
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/produits", [
            'shop_id' => $this->shop->id,
            'name' => 'Brouette',
            'purchase_price' => 15000,
            'selling_price' => 20000,
            'stock_quantity' => '',
            'track_stock' => true,
        ])->assertSessionHasNoErrors();

        $this->assertSame(0.0, Product::where('name', 'Brouette')->firstOrFail()->stock_quantity);
    }

    public function test_an_empty_stock_on_edit_keeps_the_current_stock(): void
    {
        $product = Product::factory()->create(['shop_id' => $this->shop->id, 'stock_quantity' => 12, 'track_stock' => true]);

        $this->actingAs($this->owner)->put("/{$this->owner->code_user}/produits/{$product->id}", [
            'shop_id' => $this->shop->id,
            'name' => $product->name,
            'purchase_price' => 1000,
            'selling_price' => 1500,
            'stock_quantity' => '',
            'track_stock' => true,
        ])->assertSessionHasNoErrors();

        $this->assertSame(12.0, $product->fresh()->stock_quantity);
    }
}
