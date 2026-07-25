<?php

namespace Tests\Feature\Sale;

use App\Http\Controllers\SaleController;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * A sale is immutable: it is never edited and never deleted. Correcting one goes
 * through a return (ReturnsController) or a cancellation, which flips the status and
 * puts the stock back with a traced movement.
 *
 * That property was only held up by SaleController happening not to define edit() or
 * update() — while Route::resource still registered both, pointing at methods that do
 * not exist. These tests pin the guarantee down so that adding an update() later is a
 * deliberate act with a failing test in front of it, not an accident.
 */
class SaleImmutabilityTest extends TestCase
{
    use RefreshDatabase;

    private function owner(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);

        return $user;
    }

    private function sale(Shop $shop, User $user): Sale
    {
        // Créer une ligne de vente déclenche l'enregistrement d'un mouvement de stock,
        // dont user_id est NOT NULL et vient de auth() : sans session, l'insertion échoue.
        $this->actingAs($user);

        $sale = Sale::create([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'sale_date' => now(),
            'payment_method' => 'cash',
            'status' => 'completed',
            'subtotal' => 1000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 1000,
            'amount_paid' => 1000,
            'change_amount' => 0,
            'remaining_amount' => 0,
        ]);

        $product = Product::factory()->create(['shop_id' => $shop->id]);
        $sale->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => 2,
            'unit_price' => 500,
            'total' => 1000,
        ]);

        return $sale->fresh();
    }

    public function test_no_route_can_edit_a_sale(): void
    {
        $names = collect(Route::getRoutes())->map->getName()->filter()->all();

        $this->assertNotContains('sales.edit', $names);
        $this->assertNotContains('sales.update', $names);
    }

    public function test_the_controller_exposes_no_edit_or_update_action(): void
    {
        $this->assertFalse(method_exists(SaleController::class, 'edit'));
        $this->assertFalse(method_exists(SaleController::class, 'update'));
    }

    /**
     * 405 and not 404: the URI still answers GET (show) and DELETE (cancel), so
     * "method not allowed" is the accurate response. What matters is that it is a
     * clean refusal — it used to reach SaleController@update, which does not exist,
     * and blew up as a BadMethodCallException 500.
     */
    public function test_putting_to_a_sale_is_refused_rather_than_a_server_error(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $sale = $this->sale($shop, $user);

        $this->actingAs($user)
            ->put("/{$user->code_user}/ventes/{$sale->id}", ['total' => 1])
            ->assertStatus(405);

        $this->assertSame('1000.00', (string) $sale->fresh()->total);
    }

    /**
     * destroy() is a cancellation, not a deletion: the ticket stays in the database
     * with its number, so a cancelled sale remains auditable and its number can never
     * be handed to another sale.
     */
    public function test_cancelling_a_sale_keeps_the_row_and_its_number(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->owner($shop);
        $sale = $this->sale($shop, $user);
        $ticket = $sale->ticket_number;

        $this->actingAs($user)->delete("/{$user->code_user}/ventes/{$sale->id}");

        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'ticket_number' => $ticket,
            'status' => 'cancelled',
        ]);
    }
}
