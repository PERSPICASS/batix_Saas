<?php

namespace Tests\Feature\Stock;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Depot stock had no history at all.
 *
 * Four paths write depot_products.quantity and only one recorded anything — and even that
 * one recorded only the +N landing at the counter, never the -N leaving the depot, so a
 * transfer looked like stock appearing from nowhere. "Why does this depot hold 12?" had no
 * answer anywhere in the system.
 *
 * stock_movements could not express it either: it had no depot_id.
 */
class DepotMovementLedgerTest extends TestCase
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

    /**
     * Un dépôt appartient au COMPTE, pas à une boutique : il est rattaché par `code_user`
     * et peut alimenter plusieurs boutiques. D'où le shop_id demandé au transfert.
     */
    private function depot(string $name = 'Dépôt central'): Depot
    {
        return Depot::factory()->create([
            'user_id' => $this->user->id,
            'code_user' => $this->user->code_user,
            'name' => $name,
        ]);
    }

    private function product(): Product
    {
        return Product::factory()->create(['shop_id' => $this->shop->id, 'track_stock' => true]);
    }

    private function stocked(Depot $depot, Product $product, int $quantity): DepotProduct
    {
        return DepotProduct::create([
            'depot_id' => $depot->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'min_stock_alert' => 0,
        ]);
    }

    public function test_adding_stock_to_a_depot_is_recorded(): void
    {
        $depot = $this->depot();
        $product = $this->product();

        // L'écran identifie le produit par son nom ou son SKU, pas par son identifiant.
        $this->post("/{$this->user->code_user}/depots/{$depot->id}/stock/add", [
            'name' => $product->name,
            'quantity' => 25,
        ])->assertSessionHasNoErrors();

        $movement = StockMovement::inDepot($depot->id)->firstOrFail();

        $this->assertSame(25, $movement->quantity);
        $this->assertSame('in', $movement->type);
        $this->assertSame($product->id, $movement->product_id);
    }

    /**
     * The edit screen replaces the quantity rather than adjusting it, so a discrepancy
     * vanished without trace. The difference is what has to be written down.
     */
    public function test_correcting_a_depot_quantity_records_the_difference(): void
    {
        $depot = $this->depot();
        $product = $this->product();
        $depotProduct = $this->stocked($depot, $product, 40);

        $this->patch("/{$this->user->code_user}/depots/{$depot->id}/stock/{$depotProduct->id}", [
            'quantity' => 33,
        ])->assertSessionHasNoErrors();

        $movement = StockMovement::inDepot($depot->id)->firstOrFail();

        $this->assertSame(-7, $movement->quantity);
        $this->assertSame('adjustment', $movement->type);
    }

    public function test_an_unchanged_quantity_writes_nothing(): void
    {
        $depot = $this->depot();
        $product = $this->product();
        $depotProduct = $this->stocked($depot, $product, 40);

        $this->patch("/{$this->user->code_user}/depots/{$depot->id}/stock/{$depotProduct->id}", [
            'quantity' => 40,
        ])->assertSessionHasNoErrors();

        // Un registre qui note les non-événements devient illisible.
        $this->assertSame(0, StockMovement::inDepot($depot->id)->count());
    }

    /**
     * Both sides of a depot-to-counter transfer. Only the counter's +N was recorded, so the
     * ledger showed goods being created.
     */
    public function test_a_transfer_to_the_counter_records_both_sides(): void
    {
        $depot = $this->depot();
        $product = $this->product();
        $this->stocked($depot, $product, 50);

        $this->post("/{$this->user->code_user}/depots/{$depot->id}/transfer", [
            'shop_id' => $this->shop->id,
            'items' => [['product_id' => $product->id, 'quantity' => 20]],
        ])->assertSessionHasNoErrors();

        $outOfDepot = StockMovement::inDepot($depot->id)->firstOrFail();
        $intoCounter = StockMovement::atCounter()->firstOrFail();

        $this->assertSame(-20, $outOfDepot->quantity);
        $this->assertSame(20, $intoCounter->quantity);

        // Un transfert déplace du stock, il n'en crée pas.
        $this->assertSame(0, StockMovement::sum('quantity'));
    }

    public function test_a_transfer_between_depots_records_both_sides(): void
    {
        $source = $this->depot('Dépôt A');
        $target = $this->depot('Dépôt B');
        $product = $this->product();
        $this->stocked($source, $product, 30);

        $this->post("/{$this->user->code_user}/depots/{$source->id}/transfer-depot", [
            'target_depot_id' => $target->id,
            'items' => [['product_id' => $product->id, 'quantity' => 12]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(-12, StockMovement::inDepot($source->id)->sum('quantity'));
        $this->assertSame(12, StockMovement::inDepot($target->id)->sum('quantity'));
        $this->assertSame(0, StockMovement::sum('quantity'));
    }

    /**
     * track_stock excludes a product from the ledger everywhere else; depots must not be
     * an exception.
     */
    public function test_a_product_that_is_not_tracked_stays_out_of_the_ledger(): void
    {
        $depot = $this->depot();
        $product = Product::factory()->create(['shop_id' => $this->shop->id, 'track_stock' => false]);

        $this->post("/{$this->user->code_user}/depots/{$depot->id}/stock/add", [
            'name' => $product->name,
            'quantity' => 25,
        ])->assertSessionHasNoErrors();

        $this->assertSame(0, StockMovement::count());
    }
}
