<?php

namespace Tests\Feature\Sale;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Un caissier qui se connecte arrive sur la liste des ventes, pas directement sur la caisse. */
class CashierLandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_cashier_lands_on_the_sales_list(): void
    {
        $shop = Shop::factory()->create();
        $owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $owner->id]);
        $this->subscribeOwnerOf($shop);
        $cashier = User::factory()->create(['role' => 'cashier', 'shop_id' => $shop->id]);

        $this->actingAs($cashier)->get("/{$owner->code_user}/dashboard")
            ->assertRedirect(route('sales.index', ['code_user' => $owner->code_user]));
    }
}
