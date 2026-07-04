<?php

namespace Tests\Feature\TenantIsolation;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossTenantAccessTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(?Shop $shop = null): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);

        if ($shop) {
            $shop->update(['user_id' => $user->id]);
        }

        return $user;
    }

    public function test_user_cannot_update_another_tenants_depot_product_through_their_own_depot(): void
    {
        $userA = $this->superAdmin();
        $userB = $this->superAdmin();

        $depotA = Depot::factory()->forUser($userA)->create();
        $depotB = Depot::factory()->forUser($userB)->create();
        $depotProductB = DepotProduct::factory()->for($depotB, 'depot')->create(['quantity' => 50]);

        $response = $this->actingAs($userA)
            ->patch("/{$userA->code_user}/depots/{$depotA->id}/stock/{$depotProductB->id}", [
                'quantity' => 0,
            ]);

        $response->assertNotFound();
        $this->assertSame(50, $depotProductB->fresh()->quantity);
    }

    public function test_user_cannot_remove_another_tenants_depot_product_through_their_own_depot(): void
    {
        $userA = $this->superAdmin();
        $userB = $this->superAdmin();

        $depotA = Depot::factory()->forUser($userA)->create();
        $depotB = Depot::factory()->forUser($userB)->create();
        $depotProductB = DepotProduct::factory()->for($depotB, 'depot')->create();

        $response = $this->actingAs($userA)
            ->delete("/{$userA->code_user}/depots/{$depotA->id}/stock/{$depotProductB->id}");

        $response->assertNotFound();
        $this->assertDatabaseHas('depot_products', ['id' => $depotProductB->id]);
    }

    public function test_user_cannot_update_another_tenants_expense(): void
    {
        $shopA = Shop::factory()->create();
        $userA = $this->superAdmin($shopA);
        $shopB = Shop::factory()->create();
        $this->superAdmin($shopB);

        $expenseB = Expense::factory()->create(['shop_id' => $shopB->id, 'title' => 'original']);

        $response = $this->actingAs($userA)
            ->patch("/{$userA->code_user}/depenses/{$expenseB->id}", [
                'title' => 'hijacked',
                'amount' => 1,
                'category' => 'Autre',
                'expense_date' => now()->toDateString(),
            ]);

        $response->assertForbidden();
        $this->assertSame('original', $expenseB->fresh()->title);
    }

    public function test_user_cannot_delete_another_tenants_expense(): void
    {
        $shopA = Shop::factory()->create();
        $userA = $this->superAdmin($shopA);
        $shopB = Shop::factory()->create();
        $this->superAdmin($shopB);

        $expenseB = Expense::factory()->create(['shop_id' => $shopB->id]);

        $response = $this->actingAs($userA)
            ->delete("/{$userA->code_user}/depenses/{$expenseB->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('expenses', ['id' => $expenseB->id]);
    }

    public function test_shop_id_query_param_cannot_leak_another_tenants_products_for_a_shopless_account(): void
    {
        // The exploit window: a brand new super_admin account has no shop yet (before
        // onboarding step 3), so ValidateAccountAccess never auto-populates
        // active_shop_id, leaving the shop_id query param as the only scoping signal.
        $userA = $this->superAdmin();

        $shopB = Shop::factory()->create();
        $this->superAdmin($shopB);
        Product::factory()->create(['shop_id' => $shopB->id, 'name' => 'Other Tenant Product']);

        $response = $this->actingAs($userA)
            ->get("/{$userA->code_user}/produits?shop_id={$shopB->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('products.data', 0));
    }
}
