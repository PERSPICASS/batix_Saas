<?php

namespace Tests\Feature\User;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Gestionnaire de stock : catalogue, stock, achats et dépôts — ni ventes, ni clients, ni argent. */
class StockManagerRoleTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    public function test_the_owner_creates_a_stock_manager_with_stock_modules_only(): void
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/users", [
            'name' => 'Magasinier', 'email' => 'stock@example.com', 'is_active' => true,
            'role' => 'stock_manager', 'shop_id' => $this->shop->id,
        ])->assertSessionHasNoErrors();

        $user = User::where('email', 'stock@example.com')->firstOrFail();
        $this->assertSame('stock_manager', $user->role);
        $this->assertTrue($user->hasPermission('inventory', 'create'));
        $this->assertTrue($user->hasPermission('purchases', 'edit'));
        $this->assertFalse($user->hasPermission('sales', 'view'));
        $this->assertFalse($user->hasPermission('customers', 'view'));
        $this->assertFalse($user->hasPermission('expenses', 'view'));
    }

    public function test_a_stock_manager_lands_on_the_catalogue_not_the_sales_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'stock_manager', 'shop_id' => $this->shop->id]);

        $this->actingAs($user)->get("/{$this->owner->code_user}/dashboard")
            ->assertRedirect(route('products.index', ['code_user' => $this->owner->code_user]));
    }
}
