<?php

namespace Tests\Feature\Depot;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\DepotTransfer;
use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Transfert boutique → dépôt : le comptoir renvoie du stock au dépôt. Seuls les sens
 * dépôt → boutique et dépôt → dépôt existaient ; il fallait baisser le stock boutique à
 * la main puis rajouter le stock au dépôt, sans trace commune.
 */
class ShopToDepotTransferTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $shop;
    private Depot $depot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->user->id]);
        $this->subscribeOwnerOf($this->shop);
        $this->actingAs($this->user);

        $this->depot = Depot::factory()->create([
            'user_id'   => $this->user->id,
            'code_user' => $this->user->code_user,
            'name'      => 'Dépôt central',
        ]);
    }

    private function product(array $attributes = []): Product
    {
        return Product::factory()->create(array_merge([
            'shop_id'        => $this->shop->id,
            'track_stock'    => true,
            'stock_quantity' => 30,
        ], $attributes));
    }

    private function send(array $items, ?int $shopId = null)
    {
        return $this->post("/{$this->user->code_user}/depots/{$this->depot->id}/receive-from-shop", [
            'shop_id' => $shopId ?? $this->shop->id,
            'items'   => $items,
        ]);
    }

    public function test_counter_stock_moves_into_the_depot_with_both_sides_recorded(): void
    {
        $product = $this->product();

        $this->send([['product_id' => $product->id, 'quantity' => 12]])->assertSessionHasNoErrors();

        $this->assertEquals(18, $product->fresh()->stock_quantity);
        $this->assertEquals(12, DepotProduct::where('depot_id', $this->depot->id)->where('product_id', $product->id)->value('quantity'));

        $transfer = DepotTransfer::sole();
        $this->assertSame(DepotTransfer::TO_DEPOT, $transfer->direction);
        $this->assertSame($this->shop->id, $transfer->shop_id);

        $counterOut = StockMovement::whereNull('depot_id')->sole();
        $this->assertSame(-12.0, (float) $counterOut->quantity);
        $this->assertSame('transfer', $counterOut->type);
        $this->assertSame($transfer->id, $counterOut->reference_id);

        $depotIn = StockMovement::inDepot($this->depot->id)->sole();
        $this->assertSame(12.0, (float) $depotIn->quantity);
        $this->assertSame($transfer->id, $depotIn->reference_id);
    }

    public function test_it_adds_to_an_existing_depot_line(): void
    {
        $product = $this->product();
        DepotProduct::create(['depot_id' => $this->depot->id, 'product_id' => $product->id, 'quantity' => 5, 'min_stock_alert' => 0]);

        $this->send([['product_id' => $product->id, 'quantity' => 4]])->assertSessionHasNoErrors();

        $this->assertEquals(9, DepotProduct::where('depot_id', $this->depot->id)->sole()->quantity);
    }

    /** Une ligne en défaut annule toutes les autres : rien ne bouge. */
    public function test_insufficient_stock_rolls_everything_back(): void
    {
        $ok = $this->product();
        $short = $this->product(['stock_quantity' => 3]);

        $this->send([
            ['product_id' => $ok->id, 'quantity' => 2],
            ['product_id' => $short->id, 'quantity' => 5],
        ])->assertSessionHasErrors('items.1.quantity');

        $this->assertEquals(30, $ok->fresh()->stock_quantity);
        $this->assertEquals(3, $short->fresh()->stock_quantity);
        $this->assertSame(0, DepotProduct::count());
        $this->assertSame(0, DepotTransfer::count());
        $this->assertSame(0, StockMovement::count());
    }

    public function test_a_product_of_another_account_is_refused(): void
    {
        $foreign = Product::factory()->create(['track_stock' => true, 'stock_quantity' => 50]);

        $this->send([['product_id' => $foreign->id, 'quantity' => 10]])->assertSessionHasErrors('items.0.product_id');

        $this->assertEquals(50, $foreign->fresh()->stock_quantity);
        $this->assertSame(0, DepotProduct::count());
    }

    /** Même compte, mais le produit n'est pas de la boutique d'origine annoncée. */
    public function test_a_product_of_another_shop_of_the_same_account_is_refused(): void
    {
        $otherShop = Shop::factory()->create(['user_id' => $this->user->id]);
        $product = $this->product(['shop_id' => $otherShop->id]);

        $this->send([['product_id' => $product->id, 'quantity' => 1]])->assertSessionHasErrors('items.0.product_id');

        $this->assertEquals(30, $product->fresh()->stock_quantity);
    }

    public function test_a_shop_of_another_account_is_refused(): void
    {
        $foreignShop = Shop::factory()->create();
        $product = Product::factory()->create(['shop_id' => $foreignShop->id, 'track_stock' => true, 'stock_quantity' => 50]);

        $this->send([['product_id' => $product->id, 'quantity' => 1]], $foreignShop->id)->assertSessionHasErrors('shop_id');

        $this->assertEquals(50, $product->fresh()->stock_quantity);
    }

    public function test_an_untracked_product_is_refused(): void
    {
        $product = $this->product(['track_stock' => false]);

        $this->send([['product_id' => $product->id, 'quantity' => 1]])->assertSessionHasErrors('items.0.product_id');

        $this->assertSame(0, DepotProduct::count());
    }

    public function test_the_depot_page_offers_counter_stock_and_shows_the_direction(): void
    {
        $product = $this->product();
        $this->product(['stock_quantity' => 0]);
        $this->send([['product_id' => $product->id, 'quantity' => 2]]);

        $this->get("/{$this->user->code_user}/depots/{$this->depot->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('shopProductsForDepot', 1)
                ->where('shopProductsForDepot.0.id', $product->id)
                ->where('recentTransfers.0.direction', DepotTransfer::TO_DEPOT));
    }

    /** `transfers()` lisait un `$user` jamais défini : la page d'historique était en 500. */
    public function test_the_transfer_history_page_renders(): void
    {
        $product = $this->product();
        $this->send([['product_id' => $product->id, 'quantity' => 2]]);

        $this->get("/{$this->user->code_user}/depots/{$this->depot->id}/transfers")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('transfers.data.0.direction', DepotTransfer::TO_DEPOT)
                ->has('shops', 1));
    }
}
