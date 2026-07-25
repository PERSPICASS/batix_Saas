<?php

namespace Tests\Feature\Shop;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopTransfer;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Moving stock from one shop to another.
 *
 * A product belongs to ONE shop, so nothing is "moved": the quantity leaves the source
 * product and arrives on its counterpart at the destination — matched by SKU then by name,
 * and created there if it does not exist yet. Two movements, one per shop.
 *
 * The "Voir" button that leads here showed a blank page: ShopController@show rendered
 * Shops/Show, a component that had never been written, so Inertia could not resolve it.
 */
class ShopProductTransferTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $source;
    private Shop $target;

    protected function setUp(): void
    {
        parent::setUp();

        $this->source = Shop::factory()->create(['name' => 'Boutique Cocody']);
        $this->user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->source->id]);
        $this->source->update(['user_id' => $this->user->id]);

        $this->target = Shop::factory()->create(['user_id' => $this->user->id, 'name' => 'Boutique Yopougon']);

        $this->actingAs($this->user);
    }

    private function product(Shop $shop, array $attributes = []): Product
    {
        return Product::factory()->create(array_merge([
            'shop_id' => $shop->id,
            'track_stock' => true,
            'stock_quantity' => 100,
        ], $attributes));
    }

    private function transfer(array $items, ?int $targetId = null)
    {
        return $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $targetId ?? $this->target->id,
            'items' => $items,
        ]);
    }

    public function test_the_show_page_renders(): void
    {
        $this->get("/{$this->user->code_user}/boutiques/{$this->source->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Shops/Show'));
    }

    public function test_stock_leaves_one_shop_and_arrives_at_the_other(): void
    {
        $source = $this->product($this->source, ['name' => 'Ciment 50kg', 'sku' => 'CIM-50']);
        $destination = $this->product($this->target, [
            'name' => 'Ciment 50kg',
            'sku' => 'CIM-50',
            'stock_quantity' => 5,
        ]);

        $this->transfer([['product_id' => $source->id, 'quantity' => 20]])
            ->assertSessionHas('success');

        $this->assertSame(80, $source->fresh()->stock_quantity);
        $this->assertSame(25, $destination->fresh()->stock_quantity);

        // Un transfert déplace du stock, il n'en crée pas.
        $this->assertSame(0, StockMovement::sum('quantity'));
        $this->assertSame(-20, StockMovement::where('shop_id', $this->source->id)->sum('quantity'));
        $this->assertSame(20, StockMovement::where('shop_id', $this->target->id)->sum('quantity'));
    }

    /**
     * The counterpart may simply not exist yet at the destination.
     */
    public function test_the_product_is_created_at_the_destination_when_absent(): void
    {
        $source = $this->product($this->source, [
            'name' => 'Fer à béton 8mm',
            'sku' => 'FER-8',
            'selling_price' => 3000,
        ]);

        $this->transfer([['product_id' => $source->id, 'quantity' => 15]])
            ->assertSessionHas('success');

        $created = Product::where('shop_id', $this->target->id)->where('sku', 'FER-8')->firstOrFail();

        $this->assertSame(15, $created->stock_quantity);
        $this->assertSame('Fer à béton 8mm', $created->name);
        // Le prix suit le produit : une succursale ne repart pas de zéro.
        $this->assertEquals(3000, $created->selling_price);
    }

    /**
     * SKU first: a name can be edited, a SKU is the identifier.
     */
    public function test_matching_prefers_the_sku_over_the_name(): void
    {
        $source = $this->product($this->source, ['name' => 'Ciment 50kg', 'sku' => 'CIM-50']);

        $bySku = $this->product($this->target, [
            'name' => 'Ciment cinquante kilos',
            'sku' => 'CIM-50',
            'stock_quantity' => 0,
        ]);
        $byName = $this->product($this->target, [
            'name' => 'Ciment 50kg',
            'sku' => 'AUTRE',
            'stock_quantity' => 0,
        ]);

        $this->transfer([['product_id' => $source->id, 'quantity' => 10]]);

        $this->assertSame(10, $bySku->fresh()->stock_quantity);
        $this->assertSame(0, $byName->fresh()->stock_quantity);
    }

    /**
     * Categories belong to a shop. Copying the source's category_id would have pointed the
     * new product at a category owned by ANOTHER shop.
     */
    public function test_the_category_is_matched_by_name_not_copied(): void
    {
        $sourceCategory = Category::factory()->create(['shop_id' => $this->source->id, 'name' => 'Ciment']);
        $targetCategory = Category::factory()->create(['shop_id' => $this->target->id, 'name' => 'Ciment']);

        $source = $this->product($this->source, [
            'category_id' => $sourceCategory->id,
            'name' => 'Ciment 50kg',
            'sku' => 'CIM-50',
        ]);

        $this->transfer([['product_id' => $source->id, 'quantity' => 10]]);

        $created = Product::where('shop_id', $this->target->id)->where('sku', 'CIM-50')->firstOrFail();

        $this->assertSame($targetCategory->id, $created->category_id);
        $this->assertNotSame($sourceCategory->id, $created->category_id);
    }

    /**
     * No category of that name at the destination: better no category than one belonging
     * to the neighbour.
     */
    public function test_an_unknown_category_leaves_the_product_uncategorised(): void
    {
        $sourceCategory = Category::factory()->create(['shop_id' => $this->source->id, 'name' => 'Plomberie']);

        $source = $this->product($this->source, [
            'category_id' => $sourceCategory->id,
            'sku' => 'PLB-1',
        ]);

        $this->transfer([['product_id' => $source->id, 'quantity' => 5]]);

        $created = Product::where('shop_id', $this->target->id)->where('sku', 'PLB-1')->firstOrFail();

        $this->assertNull($created->category_id);
    }

    public function test_a_transfer_leaves_a_document(): void
    {
        $source = $this->product($this->source, ['name' => 'Ciment 50kg']);

        $this->transfer([['product_id' => $source->id, 'quantity' => 20]]);

        $transfer = ShopTransfer::with('items')->firstOrFail();

        $this->assertSame($this->source->id, $transfer->from_shop_id);
        $this->assertSame($this->target->id, $transfer->to_shop_id);
        $this->assertSame($this->user->id, $transfer->user_id);
        $this->assertStringStartsWith('TRF-' . date('Ym'), $transfer->reference);

        // Un geste, une pièce : dix produits envoyés ensemble ne font pas dix transferts.
        $this->assertCount(1, $transfer->items);
        $this->assertSame('Ciment 50kg', $transfer->items->first()->product_name);
        $this->assertSame(20, $transfer->items->first()->quantity);
    }

    public function test_several_products_travel_on_one_document(): void
    {
        $first = $this->product($this->source);
        $second = $this->product($this->source);

        $this->transfer([
            ['product_id' => $first->id, 'quantity' => 5],
            ['product_id' => $second->id, 'quantity' => 8],
        ]);

        $this->assertSame(1, ShopTransfer::count());
        $this->assertCount(2, ShopTransfer::firstOrFail()->items);
    }

    /**
     * Cancelling sends the goods back. Nothing is deleted — the document stays, marked
     * cancelled, and two opposite movements join the ledger. Erasing the originals would
     * claim the transfer never happened, when it did move stock.
     */
    public function test_cancelling_a_transfer_sends_the_goods_back(): void
    {
        $source = $this->product($this->source, ['stock_quantity' => 100, 'sku' => 'CIM-50']);

        $this->transfer([['product_id' => $source->id, 'quantity' => 20]]);
        $transfer = ShopTransfer::firstOrFail();

        $this->assertSame(80, $source->fresh()->stock_quantity);

        $this->post("/{$this->user->code_user}/transferts/{$transfer->id}/annuler")
            ->assertSessionHas('success');

        $this->assertSame(100, $source->fresh()->stock_quantity);
        $this->assertSame('cancelled', $transfer->fresh()->status);
        $this->assertNotNull($transfer->fresh()->cancelled_at);

        // Le registre garde les quatre mouvements, et somme toujours à zéro.
        $this->assertSame(4, StockMovement::count());
        $this->assertSame(0, StockMovement::sum('quantity'));
    }

    public function test_a_transfer_cannot_be_cancelled_twice(): void
    {
        $source = $this->product($this->source);
        $this->transfer([['product_id' => $source->id, 'quantity' => 10]]);
        $transfer = ShopTransfer::firstOrFail();

        $this->post("/{$this->user->code_user}/transferts/{$transfer->id}/annuler");
        $this->post("/{$this->user->code_user}/transferts/{$transfer->id}/annuler")
            ->assertSessionHas('error');

        $this->assertSame(4, StockMovement::count());
    }

    /**
     * The goods must still be there to go back: the destination may have sold them.
     */
    public function test_cancelling_is_refused_when_the_goods_are_gone(): void
    {
        $source = $this->product($this->source, ['sku' => 'CIM-50']);
        $this->transfer([['product_id' => $source->id, 'quantity' => 20]]);

        $transfer = ShopTransfer::with('items')->firstOrFail();
        $destination = Product::findOrFail($transfer->items->first()->target_product_id);
        $destination->update(['stock_quantity' => 3]);

        $this->post("/{$this->user->code_user}/transferts/{$transfer->id}/annuler")
            ->assertSessionHasErrors('transfer');

        $this->assertSame('completed', $transfer->fresh()->status);
    }

    /**
     * A variation holds the stock, so it must be transferable — and its parent has to
     * exist at the destination before the child can be attached to it.
     */
    public function test_a_variation_can_be_transferred_and_brings_its_parent(): void
    {
        $parent = $this->product($this->source, [
            'name' => 'Peinture',
            'sku' => 'PEINT',
            'has_variations' => true,
            'stock_quantity' => 0,
        ]);
        $variation = $this->product($this->source, [
            'name' => 'Rouge 5L',
            'sku' => 'PEINT-R5',
            'parent_id' => $parent->id,
            'stock_quantity' => 40,
        ]);

        $this->transfer([['product_id' => $variation->id, 'quantity' => 10]])
            ->assertSessionHas('success');

        $createdVariation = Product::where('shop_id', $this->target->id)
            ->where('sku', 'PEINT-R5')
            ->firstOrFail();

        $createdParent = Product::where('shop_id', $this->target->id)
            ->where('sku', 'PEINT')
            ->firstOrFail();

        $this->assertSame(10, $createdVariation->stock_quantity);
        $this->assertSame($createdParent->id, $createdVariation->parent_id);
    }

    public function test_transferring_more_than_is_in_stock_is_refused(): void
    {
        $source = $this->product($this->source, ['stock_quantity' => 5]);

        $this->transfer([['product_id' => $source->id, 'quantity' => 10]])
            ->assertSessionHasErrors('items');

        $this->assertSame(5, $source->fresh()->stock_quantity);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_a_shop_cannot_transfer_to_itself(): void
    {
        $source = $this->product($this->source);

        $this->transfer([['product_id' => $source->id, 'quantity' => 5]], $this->source->id)
            ->assertSessionHasErrors('target_shop_id');
    }

    /**
     * The destination must belong to the same account, and the product to the source shop
     * — otherwise a transfer would be a way to reach across tenants.
     */
    public function test_another_accounts_shop_is_not_a_valid_destination(): void
    {
        $foreign = Shop::factory()->create();
        User::factory()->create(['role' => 'super_admin', 'shop_id' => $foreign->id]);
        $foreign->update(['user_id' => User::latest('id')->first()->id]);

        $source = $this->product($this->source);

        $this->transfer([['product_id' => $source->id, 'quantity' => 5]], $foreign->id)
            ->assertSessionHasErrors('target_shop_id');
    }

    public function test_a_product_from_another_shop_cannot_be_transferred(): void
    {
        $foreignProduct = $this->product($this->target);

        $this->transfer([['product_id' => $foreignProduct->id, 'quantity' => 5]])
            ->assertSessionHasErrors('items.0.product_id');
    }
}
