<?php

namespace Tests\Feature\Stock;

use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockMovementShowTest extends TestCase
{
    use RefreshDatabase;

    private function superAdminOwning(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $user;
    }

    private function movementFor(Shop $shop, User $user): StockMovement
    {
        return StockMovement::create([
            'shop_id' => $shop->id,
            'product_id' => Product::factory()->create(['shop_id' => $shop->id])->id,
            'user_id' => $user->id,
            'type' => 'in',
            'quantity' => 10,
            'movement_date' => now()->toDateString(),
        ]);
    }

    public function test_owner_can_view_a_stock_movement(): void
    {
        // Regression: the route param is {stockMovement} but show() typed its
        // argument $stock, so the model never bound — an empty StockMovement
        // (shop_id null) was injected and the access check 403-ed for everyone.
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);
        $movement = $this->movementFor($shop, $user);

        $response = $this->actingAs($user)
            ->get("/{$user->code_user}/stocks/{$movement->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Stocks/Show')
            ->where('movement.id', $movement->id)
        );
    }

    public function test_another_tenants_stock_movement_is_forbidden(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);

        $otherShop = Shop::factory()->create();
        $otherUser = $this->superAdminOwning($otherShop);
        $foreignMovement = $this->movementFor($otherShop, $otherUser);

        $response = $this->actingAs($user)
            ->get("/{$user->code_user}/stocks/{$foreignMovement->id}");

        $response->assertForbidden();
    }
}
