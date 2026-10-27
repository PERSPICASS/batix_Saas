<?php

namespace Tests\Feature\Stock;

use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Supprimer un mouvement l'annule dans le stock. Une entrée déjà vendue ne peut plus
 * l'être : en prod (Postgres), la contrainte stock_quantity >= 0 levait un 500.
 */
class StockMovementDeleteTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Product $product;
    private StockMovement $entry;

    protected function setUp(): void
    {
        parent::setUp();

        $shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($shop);

        $this->product = Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Baguette 2,5', 'stock_quantity' => 0]);
        $this->entry = StockMovement::create([
            'shop_id' => $shop->id,
            'product_id' => $this->product->id,
            'user_id' => $this->owner->id,
            'type' => 'in',
            'quantity' => 10,
            'movement_date' => now()->toDateString(),
        ]);
    }

    private function deleteEntry()
    {
        return $this->actingAs($this->owner)
            ->from("/{$this->owner->code_user}/stocks")
            ->delete("/{$this->owner->code_user}/stocks/{$this->entry->id}");
    }

    public function test_an_entry_already_sold_cannot_be_deleted(): void
    {
        $this->product->update(['stock_quantity' => 3]);

        $this->deleteEntry()->assertRedirect()->assertSessionHas('error', fn ($m) => str_contains($m, 'Baguette 2,5') && str_contains($m, 'sortie'));

        $this->assertSame(3.0, $this->product->fresh()->stock_quantity);
        $this->assertDatabaseHas('stock_movements', ['id' => $this->entry->id]);
    }

    public function test_an_entry_still_in_stock_is_reversed(): void
    {
        $this->product->update(['stock_quantity' => 12]);

        $this->deleteEntry()->assertRedirect()->assertSessionHasNoErrors()->assertSessionMissing('error');

        $this->assertSame(2.0, $this->product->fresh()->stock_quantity);
        $this->assertDatabaseMissing('stock_movements', ['id' => $this->entry->id]);
    }
}
