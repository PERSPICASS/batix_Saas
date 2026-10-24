<?php

namespace Tests\Feature\Stock;

use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Le formulaire « Nouveau mouvement » ne fait plus qu'entrées et sorties, avec un motif.
 * Seuls ces mouvements-là se suppriment depuis le journal.
 */
class ManualStockMovementTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);

        $this->product = Product::factory()->create(['shop_id' => $this->shop->id, 'stock_quantity' => 10]);
    }

    private function record(array $data)
    {
        return $this->actingAs($this->owner)
            ->from("/{$this->owner->code_user}/stocks/create")
            ->post("/{$this->owner->code_user}/stocks", $data + [
                'shop_id' => $this->shop->id,
                'product_id' => $this->product->id,
                'quantity' => 4,
                'movement_date' => now()->toDateString(),
            ]);
    }

    private function deleteMovement(StockMovement $movement)
    {
        return $this->actingAs($this->owner)
            ->from("/{$this->owner->code_user}/stocks")
            ->delete("/{$this->owner->code_user}/stocks/{$movement->id}");
    }

    public function test_an_exit_is_written_negative_and_deleting_it_puts_the_stock_back(): void
    {
        // Regression: a manual exit was written +4. Deleting it "reversed" a positive
        // quantity, so the stock lost 4 a second time instead of getting them back.
        $this->record(['type' => 'out', 'reason' => 'breakage'])->assertSessionHasNoErrors();

        $exit = StockMovement::sole();
        $this->assertSame(-4, $exit->quantity);
        $this->assertSame('breakage', $exit->reason);
        $this->assertSame(6, $this->product->fresh()->stock_quantity);

        $this->deleteMovement($exit)->assertSessionMissing('error');

        $this->assertSame(10, $this->product->fresh()->stock_quantity);
    }

    public function test_an_exit_larger_than_the_stock_is_refused(): void
    {
        $this->record(['type' => 'out', 'reason' => 'theft', 'quantity' => 11])->assertSessionHasErrors('quantity');

        $this->assertSame(10, $this->product->fresh()->stock_quantity);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_a_reason_is_required_and_must_belong_to_the_type(): void
    {
        $this->record(['type' => 'in'])->assertSessionHasErrors('reason');
        $this->record(['type' => 'in', 'reason' => 'theft'])->assertSessionHasErrors('reason');

        $this->assertSame(0, StockMovement::count());
    }

    public function test_manual_transfers_and_adjustments_are_gone(): void
    {
        // A manual "transfer" changed nothing in the stock but still wrote a line.
        $this->record(['type' => 'transfer', 'reason' => 'other'])->assertSessionHasErrors('type');
        $this->record(['type' => 'adjustment', 'reason' => 'other'])->assertSessionHasErrors('type');

        $this->assertSame(0, StockMovement::count());
    }

    public function test_a_movement_coming_from_a_sale_cannot_be_deleted_from_the_journal(): void
    {
        // Deleting it put the items back in stock while the sale still existed.
        $saleLine = StockMovement::create([
            'shop_id' => $this->shop->id,
            'product_id' => $this->product->id,
            'user_id' => $this->owner->id,
            'type' => 'sale',
            'quantity' => -2,
            'reference_type' => 'Sale',
            'reference_id' => 1,
            'movement_date' => now()->toDateString(),
        ]);

        $this->deleteMovement($saleLine)->assertSessionHas('error');

        $this->assertSame(10, $this->product->fresh()->stock_quantity);
        $this->assertDatabaseHas('stock_movements', ['id' => $saleLine->id]);
    }

    public function test_the_journal_filters_on_one_product(): void
    {
        $other = Product::factory()->create(['shop_id' => $this->shop->id]);
        $this->record(['type' => 'in', 'reason' => 'gift']);
        $this->record(['type' => 'in', 'reason' => 'gift', 'product_id' => $other->id]);

        $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/stocks?product_id={$this->product->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('product.name', $this->product->name)
                ->has('movements.data', 1)
                ->where('movements.data.0.product_id', $this->product->id));
    }
}
