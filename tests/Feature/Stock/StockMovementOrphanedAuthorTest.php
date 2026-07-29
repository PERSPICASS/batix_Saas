<?php

namespace Tests\Feature\Stock;

use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Un mouvement dont l'auteur a disparu doit rester consultable.
 *
 * `stock_movements.user_id` est nullable et en `nullOnDelete` depuis
 * make_stock_movement_author_optional : supprimer un employé conserve ses mouvements et
 * oublie seulement leur auteur. Les deux pages Stocks lisaient pourtant `movement.user.name`
 * sans garde — en prod, un seul compte supprimé suffisait à rendre la liste entièrement
 * blanche (TypeError pendant l'hydratation React, donc plus rien ne s'affichait).
 *
 * Ces tests figent la forme des données que le front doit tolérer : la relation arrive à
 * `null`, et la page se rend quand même.
 */
class StockMovementOrphanedAuthorTest extends TestCase
{
    use RefreshDatabase;

    private function superAdminOwning(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop->update(['user_id' => $user->id]);

        return $user;
    }

    private function authorlessMovement(Shop $shop): StockMovement
    {
        return StockMovement::create([
            'shop_id' => $shop->id,
            'product_id' => Product::factory()->create(['shop_id' => $shop->id])->id,
            'user_id' => null,
            'type' => 'in',
            'quantity' => 10,
            'movement_date' => now()->toDateString(),
        ]);
    }

    public function test_index_serves_a_movement_whose_author_is_gone(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);
        $movement = $this->authorlessMovement($shop);

        $response = $this->actingAs($user)->get("/{$user->code_user}/stocks");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Stocks/Index')
            ->where('movements.data.0.id', $movement->id)
            ->where('movements.data.0.user', null)
        );
    }

    public function test_show_serves_a_movement_whose_author_is_gone(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);
        $movement = $this->authorlessMovement($shop);

        $response = $this->actingAs($user)
            ->get("/{$user->code_user}/stocks/{$movement->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Stocks/Show')
            ->where('movement.user', null)
        );
    }

    public function test_deleting_a_user_keeps_their_movements_and_drops_the_author(): void
    {
        // La contrepartie de nullOnDelete : l'historique survit au départ de l'employé.
        $shop = Shop::factory()->create();
        $owner = $this->superAdminOwning($shop);
        $employee = User::factory()->create(['role' => 'staff', 'shop_id' => $shop->id]);

        $movement = StockMovement::create([
            'shop_id' => $shop->id,
            'product_id' => Product::factory()->create(['shop_id' => $shop->id])->id,
            'user_id' => $employee->id,
            'type' => 'in',
            'quantity' => 5,
            'movement_date' => now()->toDateString(),
        ]);

        $employee->delete();

        $this->assertDatabaseHas('stock_movements', ['id' => $movement->id, 'user_id' => null]);
        $this->assertNull($movement->fresh()->user);
    }
}
