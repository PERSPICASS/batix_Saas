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
 * Copying products from one shop to another.
 *
 * An account enters its catalogue once. Opening a branch must not mean typing every product
 * again: the chosen products are recreated in the destination shop with their prices, tax
 * rate and category, at zero stock.
 *
 * It is a COPY, not a movement of goods — the source shop is untouched and nothing enters
 * the stock ledger. Each shop supplies its own.
 *
 * The "Voir" button that leads here showed a blank page: ShopController@show rendered
 * Shops/Show, a component that had never been written, so Inertia could not resolve it.
 */
class ShopProductCopyTest extends TestCase
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
        $this->subscribeOwnerOf($this->source);

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

    private function copy(array $productIds, ?int $targetId = null)
    {
        return $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $targetId ?? $this->target->id,
            'product_ids' => $productIds,
        ]);
    }

    public function test_the_show_page_renders(): void
    {
        $this->get("/{$this->user->code_user}/boutiques/{$this->source->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Shops/Show'));
    }

    /**
     * The point of the whole feature: nothing has to be typed twice.
     */
    public function test_a_copied_product_arrives_fully_filled_in(): void
    {
        $source = $this->product($this->source, [
            'name' => 'Ciment 50kg',
            'sku' => 'CIM-50',
            'brand' => 'Lafarge',
            'unit' => 'sac',
            'purchase_price' => 4000,
            'selling_price' => 5000,
            'tax_rate' => 18,
            'min_stock_alert' => 10,
        ]);

        $this->copy([$source->id])->assertSessionHas('success');

        $created = Product::where('shop_id', $this->target->id)->where('sku', 'CIM-50')->firstOrFail();

        $this->assertSame('Ciment 50kg', $created->name);
        $this->assertSame('Lafarge', $created->brand);
        $this->assertSame('sac', $created->unit);
        $this->assertEquals(4000, $created->purchase_price);
        $this->assertEquals(5000, $created->selling_price);
        $this->assertEquals(18, $created->tax_rate);
        $this->assertSame(10, $created->min_stock_alert);
    }

    /**
     * The whole reason this was reworked: copying must not take stock away from the shop
     * that already holds it.
     */
    public function test_the_source_shop_keeps_its_stock(): void
    {
        $source = $this->product($this->source, ['stock_quantity' => 120]);

        $this->copy([$source->id])->assertSessionHas('success');

        $this->assertSame(120, $source->fresh()->stock_quantity);

        // Aucune marchandise n'a bougé : le registre des stocks reste vide.
        $this->assertSame(0, StockMovement::count());
    }

    public function test_the_destination_starts_at_zero_stock(): void
    {
        $source = $this->product($this->source, ['stock_quantity' => 120, 'sku' => 'CIM-50']);

        $this->copy([$source->id]);

        $created = Product::where('shop_id', $this->target->id)->where('sku', 'CIM-50')->firstOrFail();

        $this->assertSame(0, $created->stock_quantity);
    }

    /**
     * A branch that is opening needs the catalogue before it has any goods — so a product
     * sitting at zero must be copyable too. The earlier version filtered those out.
     */
    public function test_a_product_with_no_stock_can_still_be_copied(): void
    {
        $source = $this->product($this->source, ['stock_quantity' => 0, 'sku' => 'RUPTURE']);

        $this->copy([$source->id])->assertSessionHas('success');

        $this->assertNotNull(
            Product::where('shop_id', $this->target->id)->where('sku', 'RUPTURE')->first()
        );
    }

    /**
     * Already there: nothing is recreated and nothing is touched — the destination may have
     * adjusted its own price since.
     */
    public function test_an_existing_product_is_left_alone(): void
    {
        $source = $this->product($this->source, ['name' => 'Ciment 50kg', 'sku' => 'CIM-50']);
        $existing = $this->product($this->target, [
            'name' => 'Ciment 50kg',
            'sku' => 'CIM-50',
            'selling_price' => 9999,
            'stock_quantity' => 42,
        ]);

        $this->copy([$source->id])->assertSessionHas('info');

        $existing->refresh();
        $this->assertEquals(9999, $existing->selling_price);
        $this->assertSame(42, $existing->stock_quantity);
        $this->assertSame(1, Product::where('shop_id', $this->target->id)->count());
    }

    public function test_matching_prefers_the_sku_over_the_name(): void
    {
        $source = $this->product($this->source, ['name' => 'Ciment 50kg', 'sku' => 'CIM-50']);
        $this->product($this->target, ['name' => 'Ciment cinquante kilos', 'sku' => 'CIM-50']);

        $this->copy([$source->id])->assertSessionHas('info');

        // Reconnu par son SKU : rien n'est créé en double.
        $this->assertSame(1, Product::where('shop_id', $this->target->id)->count());
    }

    /**
     * Categories belong to a shop. Copying the source's category_id would have pointed the
     * new product at a category owned by ANOTHER shop.
     */
    public function test_the_category_is_matched_by_name_not_copied(): void
    {
        $sourceCategory = Category::factory()->create(['shop_id' => $this->source->id, 'name' => 'Ciment']);
        $targetCategory = Category::factory()->create(['shop_id' => $this->target->id, 'name' => 'Ciment']);

        $source = $this->product($this->source, ['category_id' => $sourceCategory->id, 'sku' => 'CIM-50']);

        $this->copy([$source->id]);

        $created = Product::where('shop_id', $this->target->id)->where('sku', 'CIM-50')->firstOrFail();

        $this->assertSame($targetCategory->id, $created->category_id);
        $this->assertNotSame($sourceCategory->id, $created->category_id);
    }

    public function test_an_unknown_category_leaves_the_product_uncategorised(): void
    {
        $sourceCategory = Category::factory()->create(['shop_id' => $this->source->id, 'name' => 'Plomberie']);
        $source = $this->product($this->source, ['category_id' => $sourceCategory->id, 'sku' => 'PLB-1']);

        $this->copy([$source->id]);

        $created = Product::where('shop_id', $this->target->id)->where('sku', 'PLB-1')->firstOrFail();

        $this->assertNull($created->category_id);
    }

    /**
     * A variation cannot exist without its parent, so the parent is copied first.
     */
    public function test_a_variation_brings_its_parent_along(): void
    {
        $parent = $this->product($this->source, [
            'name' => 'Peinture',
            'sku' => 'PEINT',
            'has_variations' => true,
        ]);
        $variation = $this->product($this->source, [
            'name' => 'Rouge 5L',
            'sku' => 'PEINT-R5',
            'parent_id' => $parent->id,
        ]);

        $this->copy([$variation->id])->assertSessionHas('success');

        $createdVariation = Product::where('shop_id', $this->target->id)->where('sku', 'PEINT-R5')->firstOrFail();
        $createdParent = Product::where('shop_id', $this->target->id)->where('sku', 'PEINT')->firstOrFail();

        $this->assertSame($createdParent->id, $createdVariation->parent_id);
    }

    public function test_a_copy_leaves_a_document(): void
    {
        $first = $this->product($this->source, ['name' => 'Ciment 50kg']);
        $second = $this->product($this->source, ['name' => 'Fer à béton']);

        $this->copy([$first->id, $second->id]);

        $transfer = ShopTransfer::with('items')->firstOrFail();

        $this->assertSame($this->source->id, $transfer->from_shop_id);
        $this->assertSame($this->target->id, $transfer->to_shop_id);
        $this->assertSame($this->user->id, $transfer->user_id);
        $this->assertStringStartsWith('TRF-' . date('Ym'), $transfer->reference);

        // Un geste, une pièce : deux produits copiés ensemble ne font pas deux documents.
        $this->assertSame(1, ShopTransfer::count());
        $this->assertCount(2, $transfer->items);
    }

    /**
     * Opening a shop is the case this exists for: the whole catalogue in one gesture,
     * without listing hundreds of ids in the request.
     */
    public function test_the_whole_catalogue_can_be_copied_at_once(): void
    {
        $this->product($this->source, ['sku' => 'A']);
        $this->product($this->source, ['sku' => 'B']);
        $this->product($this->source, ['sku' => 'C', 'stock_quantity' => 0]);

        $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $this->target->id,
            'all_products' => true,
        ])->assertSessionHas('success');

        $this->assertSame(3, Product::where('shop_id', $this->target->id)->count());

        // Toujours une copie : la source garde tout, le registre reste vide.
        $this->assertSame(3, Product::where('shop_id', $this->source->id)->count());
        $this->assertSame(0, StockMovement::count());
    }

    public function test_copying_everything_skips_what_is_already_there(): void
    {
        $this->product($this->source, ['name' => 'Ciment 50kg', 'sku' => 'CIM-50']);
        $this->product($this->source, ['name' => 'Fer à béton', 'sku' => 'FER-8']);
        $this->product($this->target, ['name' => 'Ciment 50kg', 'sku' => 'CIM-50']);

        $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $this->target->id,
            'all_products' => true,
        ])->assertSessionHas('success');

        // Un seul ajout : l'autre était déjà là.
        $this->assertSame(2, Product::where('shop_id', $this->target->id)->count());
        $this->assertCount(1, ShopTransfer::with('items')->firstOrFail()->items);
    }

    /**
     * Copying everything must not reach into another shop's catalogue.
     */
    public function test_copying_everything_only_takes_this_shops_products(): void
    {
        $this->product($this->source, ['sku' => 'MIEN']);

        $otherAccountShop = Shop::factory()->create();
        $this->product($otherAccountShop, ['sku' => 'AUTRE']);

        $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $this->target->id,
            'all_products' => true,
        ]);

        $this->assertSame(1, Product::where('shop_id', $this->target->id)->count());
        $this->assertNull(Product::where('shop_id', $this->target->id)->where('sku', 'AUTRE')->first());
    }

    public function test_a_selection_is_still_required_when_not_copying_everything(): void
    {
        $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $this->target->id,
        ])->assertSessionHasErrors('product_ids');
    }

    /**
     * Copying everything drags variations in too, and a variation cannot exist before its
     * parent — hence the ordering that puts parents first.
     */
    public function test_copying_everything_keeps_variations_attached(): void
    {
        $parent = $this->product($this->source, ['sku' => 'PEINT', 'has_variations' => true]);
        $this->product($this->source, ['sku' => 'PEINT-R5', 'parent_id' => $parent->id]);
        $this->product($this->source, ['sku' => 'PEINT-B5', 'parent_id' => $parent->id]);

        $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $this->target->id,
            'all_products' => true,
        ])->assertSessionHas('success');

        $createdParent = Product::where('shop_id', $this->target->id)->where('sku', 'PEINT')->firstOrFail();

        foreach (['PEINT-R5', 'PEINT-B5'] as $sku) {
            $variation = Product::where('shop_id', $this->target->id)->where('sku', $sku)->firstOrFail();
            $this->assertSame($createdParent->id, $variation->parent_id);
        }

        // Le parent n'est créé qu'une fois, malgré ses deux déclinaisons.
        $this->assertSame(3, Product::where('shop_id', $this->target->id)->count());
    }

    /**
     * The bug this guards: on a 3048-product catalogue holding only 1031 distinct names,
     * the copy created 1031 products. The fallback matched on the NAME ALONE, so every
     * homonym looked like something already copied.
     */
    public function test_products_sharing_a_name_are_all_copied(): void
    {
        $this->product($this->source, ['name' => 'Coude PVC', 'brand' => 'Nicoll', 'sku' => 'A1']);
        $this->product($this->source, ['name' => 'Coude PVC', 'brand' => 'Interplast', 'sku' => 'A2']);
        $this->product($this->source, ['name' => 'Coude PVC', 'brand' => 'Wavin', 'sku' => 'A3']);

        $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $this->target->id,
            'all_products' => true,
        ])->assertSessionHas('success');

        $this->assertSame(3, Product::where('shop_id', $this->target->id)->count());
    }

    /**
     * Name AND brand, which is also what the importers match on. Same name and same brand
     * is the same product.
     */
    public function test_the_same_name_and_brand_is_recognised_as_present(): void
    {
        $source = $this->product($this->source, ['name' => 'Coude PVC', 'brand' => 'Nicoll', 'sku' => null]);
        $this->product($this->target, ['name' => 'Coude PVC', 'brand' => 'Nicoll', 'sku' => null]);

        $this->copy([$source->id])->assertSessionHas('info');

        $this->assertSame(1, Product::where('shop_id', $this->target->id)->count());
    }

    /**
     * A null brand must not match anything and everything: `where('brand', null)` never
     * matches in SQL, so it has to be whereNull.
     */
    public function test_a_product_without_a_brand_is_still_recognised(): void
    {
        $source = $this->product($this->source, ['name' => 'Vis 4x30', 'brand' => null, 'sku' => null]);
        $this->product($this->target, ['name' => 'Vis 4x30', 'brand' => null, 'sku' => null]);

        $this->copy([$source->id])->assertSessionHas('info');

        $this->assertSame(1, Product::where('shop_id', $this->target->id)->count());
    }

    /**
     * The same variation name under two different parents is two different products.
     */
    public function test_identical_variation_names_under_different_parents_both_arrive(): void
    {
        $first = $this->product($this->source, ['name' => 'Peinture A', 'sku' => 'PA', 'has_variations' => true]);
        $second = $this->product($this->source, ['name' => 'Peinture B', 'sku' => 'PB', 'has_variations' => true]);

        $this->product($this->source, ['name' => 'Rouge 5L', 'sku' => null, 'parent_id' => $first->id]);
        $this->product($this->source, ['name' => 'Rouge 5L', 'sku' => null, 'parent_id' => $second->id]);

        $this->post("/{$this->user->code_user}/boutiques/{$this->source->id}/transferer", [
            'target_shop_id' => $this->target->id,
            'all_products' => true,
        ])->assertSessionHas('success');

        $this->assertSame(4, Product::where('shop_id', $this->target->id)->count());
        $this->assertSame(2, Product::where('shop_id', $this->target->id)->where('name', 'Rouge 5L')->count());
    }

    public function test_a_shop_cannot_copy_to_itself(): void
    {
        $source = $this->product($this->source);

        $this->copy([$source->id], $this->source->id)
            ->assertSessionHasErrors('target_shop_id');
    }

    /**
     * The destination must belong to the same account, and the product to the source shop
     * — otherwise a copy would be a way to reach across tenants.
     */
    public function test_another_accounts_shop_is_not_a_valid_destination(): void
    {
        $foreign = Shop::factory()->create();
        $foreignOwner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $foreign->id]);
        $foreign->update(['user_id' => $foreignOwner->id]);
        $this->subscribeOwnerOf($foreign);

        $source = $this->product($this->source);

        $this->copy([$source->id], $foreign->id)
            ->assertSessionHasErrors('target_shop_id');
    }

    public function test_a_product_from_another_shop_cannot_be_copied(): void
    {
        $foreignProduct = $this->product($this->target);

        $this->copy([$foreignProduct->id])
            ->assertSessionHasErrors('product_ids.0');
    }
}
