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
 * Le cycle de vie d'un inventaire : brouillon, comptage, application aux stocks.
 *
 * Le module n'avait aucun test, et deux défauts s'y étaient installés : `update()` acceptait
 * le statut `completed` — figeant un inventaire « terminé » dont les stocks n'avaient jamais
 * bougé, et que plus aucune route ne pouvait rattraper — et `complete()` ne refusait qu'un
 * inventaire déjà terminé, jamais un inventaire annulé.
 */
class InventoryWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $shop;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'super_admin']);
        $this->shop = Shop::factory()->create(['user_id' => $this->user->id]);
        $this->user->update(['shop_id' => $this->shop->id]);
        $this->user = $this->user->fresh();

        $this->product = Product::factory()->create([
            'shop_id' => $this->shop->id,
            'stock_quantity' => 10,
            'defective_stock_quantity' => 3,
            'is_active' => true,
            'parent_id' => null,
        ]);
    }

    private function draft(int $counted = 7, int $defective = 3, string $status = 'draft'): Inventory
    {
        $inventory = Inventory::create([
            'shop_id' => $this->shop->id,
            'user_id' => $this->user->id,
            'inventory_date' => now()->toDateString(),
            'status' => $status,
        ]);

        InventoryItem::create([
            'inventory_id' => $inventory->id,
            'product_id' => $this->product->id,
            'expected_quantity' => 10,
            'expected_defective_quantity' => 3,
            'counted_quantity' => $counted,
            'defective_quantity' => $defective,
            'unit_cost' => 5,
        ]);

        return $inventory;
    }

    private function url(string $name, ?Inventory $inventory = null): string
    {
        $params = ['code_user' => $this->user->code_user];

        if ($inventory) {
            $params['inventory'] = $inventory->id;
        }

        return route($name, $params);
    }

    // ── Terminer un inventaire ───────────────────────────────────────────────

    public function test_completing_an_inventory_adjusts_the_stock_and_is_dated(): void
    {
        $inventory = $this->draft(counted: 7, defective: 5);

        $this->actingAs($this->user)->post($this->url('inventory.complete', $inventory));

        $this->assertSame(7, $this->product->fresh()->stock_quantity);
        $this->assertSame(5, $this->product->fresh()->defective_stock_quantity);
        $this->assertSame('completed', $inventory->fresh()->status);
        $this->assertNotNull($inventory->fresh()->completed_at);
    }

    /**
     * Le statut `completed` n'appartient qu'à complete(), seul endroit qui ajuste les stocks.
     * Accepté par update(), il produisait un inventaire terminé sans mouvement de stock, et
     * définitivement bloqué : update(), complete() et destroy() refusent tous un inventaire
     * terminé.
     */
    public function test_update_cannot_mark_an_inventory_completed(): void
    {
        $inventory = $this->draft();

        $this->actingAs($this->user)
            ->put($this->url('inventory.update', $inventory), [
                'shop_id' => $this->shop->id,
                'inventory_date' => now()->toDateString(),
                'status' => 'completed',
                'items' => [['product_id' => $this->product->id, 'counted_quantity' => 7, 'defective_quantity' => 3]],
            ])
            ->assertSessionHasErrors('status');

        $this->assertSame('draft', $inventory->fresh()->status);
        $this->assertSame(10, $this->product->fresh()->stock_quantity);
    }

    public function test_a_cancelled_inventory_cannot_be_applied(): void
    {
        $inventory = $this->draft(status: 'cancelled');

        $this->actingAs($this->user)
            ->post($this->url('inventory.complete', $inventory))
            ->assertSessionHasErrors('error');

        $this->assertSame('cancelled', $inventory->fresh()->status);
        $this->assertSame(10, $this->product->fresh()->stock_quantity);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_completing_twice_adjusts_once(): void
    {
        $inventory = $this->draft(counted: 7, defective: 3);

        $this->actingAs($this->user)->post($this->url('inventory.complete', $inventory));
        $this->actingAs($this->user)->post($this->url('inventory.complete', $inventory));

        // Le compteur est fixé en absolu, donc insensible à la répétition ; le registre, lui,
        // porterait deux fois le même écart — exactement la dérive que stock:audit signale.
        $this->assertSame(7, $this->product->fresh()->stock_quantity);
        $this->assertSame(1, StockMovement::where('product_id', $this->product->id)->count());
    }

    /**
     * Un inventaire qui ne constate aucun écart ne doit rien écrire. La condition d'écriture
     * du défectueux portait sur `counted > 0`, donc un mouvement de quantité 0 partait au
     * registre dès qu'un produit avait des pièces défectueuses, même inchangées.
     */
    public function test_an_inventory_without_discrepancy_writes_no_movement(): void
    {
        $inventory = $this->draft(counted: 10, defective: 3);

        $this->actingAs($this->user)->post($this->url('inventory.complete', $inventory));

        $this->assertSame('completed', $inventory->fresh()->status);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_only_the_defective_side_moving_is_recorded(): void
    {
        $inventory = $this->draft(counted: 10, defective: 6);

        $this->actingAs($this->user)->post($this->url('inventory.complete', $inventory));

        $movements = StockMovement::all();
        $this->assertCount(1, $movements);
        $this->assertSame('return_defective', $movements->first()->type);
        $this->assertSame(3, $movements->first()->quantity);
    }

    // ── Saisie ───────────────────────────────────────────────────────────────

    public function test_the_same_product_cannot_be_counted_twice(): void
    {
        $this->actingAs($this->user)
            ->post($this->url('inventory.store'), [
                'shop_id' => $this->shop->id,
                'inventory_date' => now()->toDateString(),
                'items' => [
                    ['product_id' => $this->product->id, 'counted_quantity' => 5],
                    ['product_id' => $this->product->id, 'counted_quantity' => 9],
                ],
            ])
            ->assertSessionHasErrors('items.1.product_id');

        // Auparavant : violation du unique (inventory_id, product_id), donc une 500.
        $this->assertSame(0, Inventory::count());
    }

    /**
     * Le chemin nominal, et il compte : le refus de changer de boutique s'appuie sur le
     * `shop_id` que le formulaire renvoie. S'il ne le renvoyait pas à l'identique, plus aucune
     * modification ne passerait.
     */
    public function test_a_draft_can_be_recounted(): void
    {
        $inventory = $this->draft(counted: 7);

        $this->actingAs($this->user)
            ->put($this->url('inventory.update', $inventory), [
                'shop_id' => $this->shop->id,
                'inventory_date' => now()->toDateString(),
                'status' => 'in_progress',
                'items' => [['product_id' => $this->product->id, 'counted_quantity' => 4, 'defective_quantity' => 1]],
            ])
            ->assertSessionHasNoErrors();

        $inventory->refresh();
        $this->assertSame('in_progress', $inventory->status);
        $this->assertSame(4, $inventory->items->first()->counted_quantity);
        // La quantité attendue reste celle du premier comptage, elle ne suit pas le stock vivant.
        $this->assertSame(10, $inventory->items->first()->expected_quantity);
        $this->assertSame(-6, $inventory->items->first()->difference);
    }

    public function test_an_inventory_cannot_change_shop(): void
    {
        $inventory = $this->draft();
        $other = Shop::factory()->create(['user_id' => $this->user->id]);
        $otherProduct = Product::factory()->create(['shop_id' => $other->id, 'parent_id' => null]);

        $this->actingAs($this->user)
            ->put($this->url('inventory.update', $inventory), [
                'shop_id' => $other->id,
                'inventory_date' => now()->toDateString(),
                'status' => 'draft',
                'items' => [['product_id' => $otherProduct->id, 'counted_quantity' => 1]],
            ])
            ->assertSessionHasErrors('shop_id');

        $this->assertSame($this->shop->id, $inventory->fresh()->shop_id);
    }

    public function test_a_completed_inventory_cannot_be_deleted(): void
    {
        $inventory = $this->draft();
        $this->actingAs($this->user)->post($this->url('inventory.complete', $inventory));

        $this->actingAs($this->user)
            ->delete($this->url('inventory.destroy', $inventory))
            ->assertSessionHasErrors('error');

        $this->assertDatabaseHas('inventories', ['id' => $inventory->id]);
    }
}
