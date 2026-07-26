<?php

namespace Tests\Feature\Inventory;

use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * L'écart affiché sur la fiche est celui qui a été appliqué.
 *
 * `expected_quantity` était figé au compteur du jour de la création, alors que l'ajustement se
 * calcule sur le compteur du jour de l'application. Un brouillon laissé ouvert pendant que le
 * stock bougeait affichait donc un écart qui n'était pas celui écrit au registre — dans un
 * document qui présente ce nombre comme un fait constaté.
 */
class ExpectedRealignmentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'super_admin']);
        $this->shop = Shop::factory()->create(['user_id' => $this->user->id]);
        $this->user->update(['shop_id' => $this->shop->id]);
        $this->user = $this->user->fresh();
    }

    private function product(int $stock, int $defective = 0): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'stock_quantity' => $stock,
            'defective_stock_quantity' => $defective,
            'is_active' => true,
            'parent_id' => null,
        ]);
    }

    private function draftCounting(Product $product, int $counted, ?int $defective = null): Inventory
    {
        $inventory = Inventory::create([
            'shop_id' => $this->shop->id,
            'user_id' => $this->user->id,
            'inventory_date' => now()->toDateString(),
            'status' => 'draft',
        ]);

        InventoryItem::create([
            'inventory_id' => $inventory->id,
            'product_id' => $product->id,
            'expected_quantity' => $product->stock_quantity,
            'expected_defective_quantity' => $product->defective_stock_quantity,
            'counted_quantity' => $counted,
            'defective_quantity' => $defective,
            'unit_cost' => 2600,
        ]);

        return $inventory;
    }

    /** Le compteur bouge entre création et application — par une vente, un achat, un transfert. */
    private function counterMovesTo(Product $product, int $quantity): void
    {
        Product::whereKey($product->id)->update(['stock_quantity' => $quantity]);
    }

    private function complete(Inventory $inventory)
    {
        return $this->actingAs($this->user)->post(route('inventory.complete', [
            'code_user' => $this->user->code_user,
            'inventory' => $inventory->id,
        ]));
    }

    public function test_the_expected_quantity_follows_the_counter_actually_measured(): void
    {
        $product = $this->product(stock: 189);
        $inventory = $this->draftCounting($product, counted: 100);

        // Le brouillon dort, le stock descend à 150.
        $this->counterMovesTo($product, 150);

        $this->complete($inventory);

        $item = $inventory->fresh()->items->first();

        // Auparavant : 189, donc un écart de -89 affiché pour un mouvement de -50.
        $this->assertSame(150, $item->expected_quantity);
        $this->assertSame(-50, $item->difference);
    }

    public function test_the_displayed_difference_equals_the_movement_written(): void
    {
        $product = $this->product(stock: 189);
        $inventory = $this->draftCounting($product, counted: 100);

        $this->counterMovesTo($product, 150);
        $this->complete($inventory);

        $item = $inventory->fresh()->items->first();
        $movement = StockMovement::where('product_id', $product->id)
            ->where('type', 'adjustment')
            ->firstOrFail();

        // C'est tout l'objet du réalignement : un seul nombre, pas deux.
        $this->assertSame($item->difference, $movement->quantity);
        $this->assertSame(100, $product->fresh()->stock_quantity);
    }

    public function test_the_defective_side_is_realigned_too(): void
    {
        $product = $this->product(stock: 50, defective: 2);
        $inventory = $this->draftCounting($product, counted: 50, defective: 6);

        // Deux pièces défectueuses de plus constatées ailleurs entre-temps.
        Product::whereKey($product->id)->update(['defective_stock_quantity' => 4]);

        $this->complete($inventory);

        $item = $inventory->fresh()->items->first();
        $this->assertSame(4, $item->expected_defective_quantity);
        $this->assertSame(2, $item->defective_difference);
    }

    public function test_a_stable_counter_changes_nothing(): void
    {
        $product = $this->product(stock: 189);
        $inventory = $this->draftCounting($product, counted: 100);

        $this->complete($inventory);

        $item = $inventory->fresh()->items->first();
        $this->assertSame(189, $item->expected_quantity);
        $this->assertSame(-89, $item->difference);
    }

    /** Le compte d'écarts de la fiche est refait après réalignement, sinon il mentirait aussi. */
    public function test_the_discrepancy_count_is_recomputed(): void
    {
        $product = $this->product(stock: 189);
        $inventory = $this->draftCounting($product, counted: 100);

        // Le stock rejoint le comptage : à l'application, il n'y a plus d'écart du tout.
        $this->counterMovesTo($product, 100);

        $this->complete($inventory);

        $this->assertSame(0, $inventory->fresh()->total_discrepancies);
        $this->assertSame(0, StockMovement::count());
    }

    /** Une ligne non comptée n'est pas réalignée : elle n'a rien mesuré. */
    public function test_an_uncounted_line_keeps_its_expected_quantity(): void
    {
        $counted = $this->product(stock: 50);
        $skipped = $this->product(stock: 30);

        $inventory = $this->draftCounting($counted, counted: 48);
        InventoryItem::create([
            'inventory_id' => $inventory->id,
            'product_id' => $skipped->id,
            'expected_quantity' => 30,
            'counted_quantity' => null,
            'unit_cost' => 100,
        ]);

        $this->counterMovesTo($skipped, 12);
        $this->complete($inventory);

        $item = $inventory->fresh()->items->firstWhere('product_id', $skipped->id);
        $this->assertSame(30, $item->expected_quantity);
        $this->assertNull($item->counted_quantity);
        $this->assertSame(12, $skipped->fresh()->stock_quantity);
    }
}
