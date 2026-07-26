<?php

namespace Tests\Feature\Inventory;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * « Pas compté » n'est pas « compté zéro ».
 *
 * Le contrôleur écrasait le null par 0 avant l'enregistrement : ajouter un produit à
 * l'inventaire puis laisser la case vide annonçait un manque égal à tout le stock, et
 * l'application mettait ce stock à zéro. C'est ce qui obligeait à tout saisir pour ne rien
 * casser — et donc ce qui rendait tentant de préremplir les comptages, ce qui aurait ôté à
 * l'inventaire sa raison d'être.
 */
class UncountedLinesTest extends TestCase
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

    private function product(int $stock = 40, int $defective = 2): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'stock_quantity' => $stock,
            'defective_stock_quantity' => $defective,
            'is_active' => true,
            'parent_id' => null,
        ]);
    }

    private function store(array $items)
    {
        return $this->actingAs($this->user)->post(
            route('inventory.store', ['code_user' => $this->user->code_user]),
            [
                'shop_id' => $this->shop->id,
                'inventory_date' => now()->toDateString(),
                'items' => $items,
            ]
        );
    }

    private function complete(Inventory $inventory)
    {
        return $this->actingAs($this->user)->post(route('inventory.complete', [
            'code_user' => $this->user->code_user,
            'inventory' => $inventory->id,
        ]));
    }

    public function test_a_blank_count_is_stored_as_not_counted(): void
    {
        $product = $this->product(stock: 40);

        $this->store([['product_id' => $product->id, 'counted_quantity' => '', 'defective_quantity' => '']]);

        $item = Inventory::first()->items->first();
        $this->assertNull($item->counted_quantity);
        $this->assertNull($item->defective_quantity);
        // Et surtout : aucun écart annoncé. C'était -40 auparavant.
        $this->assertSame(0, $item->difference);
        $this->assertSame(0, $item->defective_difference);
    }

    public function test_an_uncounted_line_leaves_the_stock_alone(): void
    {
        $counted = $this->product(stock: 40);
        $skipped = $this->product(stock: 25);

        $this->store([
            ['product_id' => $counted->id, 'counted_quantity' => 38, 'defective_quantity' => 2],
            ['product_id' => $skipped->id, 'counted_quantity' => '', 'defective_quantity' => ''],
        ]);

        $this->complete(Inventory::first());

        $this->assertSame(38, $counted->fresh()->stock_quantity);
        // Auparavant : 0, tout le stock effacé pour n'avoir pas été regardé.
        $this->assertSame(25, $skipped->fresh()->stock_quantity);
        $this->assertSame(1, StockMovement::count());
    }

    public function test_a_counted_zero_still_empties_the_stock(): void
    {
        // Compter zéro reste une information : le rayon est vide, et l'inventaire doit le dire.
        $product = $this->product(stock: 40);

        $this->store([['product_id' => $product->id, 'counted_quantity' => 0, 'defective_quantity' => 0]]);
        $this->complete(Inventory::first());

        $this->assertSame(0, $product->fresh()->stock_quantity);
    }

    public function test_an_uncounted_defective_keeps_the_existing_one(): void
    {
        $product = $this->product(stock: 40, defective: 3);

        $this->store([['product_id' => $product->id, 'counted_quantity' => 40, 'defective_quantity' => '']]);
        $this->complete(Inventory::first());

        // Ne pas avoir compté le défectueux ne veut pas dire qu'il n'y en a plus.
        $this->assertSame(3, $product->fresh()->defective_stock_quantity);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_an_inventory_where_nothing_was_counted_cannot_be_applied(): void
    {
        $product = $this->product(stock: 40);

        $this->store([['product_id' => $product->id, 'counted_quantity' => '', 'defective_quantity' => '']]);
        $inventory = Inventory::first();

        $this->complete($inventory)->assertSessionHasErrors('error');

        // Sans cette garde, l'inventaire posait un `completed_at` — donc une nouvelle borne
        // « depuis le dernier inventaire » ne reposant sur aucun comptage.
        $this->assertSame('draft', $inventory->fresh()->status);
        $this->assertNull($inventory->fresh()->completed_at);
    }

    public function test_the_completion_preview_omits_uncounted_lines(): void
    {
        $counted = $this->product(stock: 40);
        $skipped = $this->product(stock: 25);

        $this->store([
            ['product_id' => $counted->id, 'counted_quantity' => 38],
            ['product_id' => $skipped->id, 'counted_quantity' => ''],
        ]);

        $response = $this->actingAs($this->user)->getJson(route('inventory.completion-preview', [
            'code_user' => $this->user->code_user,
            'inventory' => Inventory::first()->id,
        ]))->assertOk();

        $items = $response->json('items');
        $this->assertCount(1, $items);
        $this->assertSame($counted->name, $items[0]['product_name']);
        $this->assertSame(38, $items[0]['good_after']);
    }

    public function test_uncounted_lines_do_not_count_as_discrepancies(): void
    {
        $product = $this->product(stock: 40);
        $other = $this->product(stock: 10);

        $this->store([
            ['product_id' => $product->id, 'counted_quantity' => 37],
            ['product_id' => $other->id, 'counted_quantity' => ''],
        ]);

        $inventory = Inventory::first();
        $this->assertSame(2, $inventory->total_items);
        $this->assertSame(1, $inventory->total_discrepancies);
    }
}
