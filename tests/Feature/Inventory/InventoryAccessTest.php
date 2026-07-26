<?php

namespace Tests\Feature\Inventory;

use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Qui voit quoi dans le module inventaire.
 *
 * index() et create() filtraient sur `shop.user_id = Auth::id()`, c'est-à-dire les boutiques
 * POSSÉDÉES. Un gérant n'en possède aucune : la liste lui sortait vide et la page de création
 * sans aucun produit, alors que ses permissions `inventory` lui en donnaient l'accès et que
 * show()/edit()/update() l'acceptaient déjà. Un rôle n'est pas une frontière de tenant —
 * accessibleShopsQuery() l'est.
 */
class InventoryAccessTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop, 2: Product} */
    private function account(): array
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $owner->id]);
        $owner->update(['shop_id' => $shop->id]);

        $product = Product::factory()->create([
            'shop_id' => $shop->id, 'is_active' => true, 'parent_id' => null,
        ]);

        return [$owner->fresh(), $shop, $product];
    }

    private function inventoryIn(Shop $shop, User $user): Inventory
    {
        $inventory = Inventory::create([
            'shop_id' => $shop->id, 'user_id' => $user->id,
            'inventory_date' => now()->toDateString(), 'status' => 'draft',
        ]);

        InventoryItem::create([
            'inventory_id' => $inventory->id,
            'product_id' => Product::where('shop_id', $shop->id)->value('id'),
            'expected_quantity' => 1, 'counted_quantity' => 1, 'unit_cost' => 1,
        ]);

        return $inventory;
    }

    private function staffOf(Shop $shop, string $role = 'manager'): User
    {
        $staff = User::factory()->create(['role' => $role, 'shop_id' => $shop->id]);
        $staff->permissions()->create([
            'module' => 'inventory',
            'can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true,
        ]);

        return $staff->fresh();
    }

    private function listed($response): array
    {
        return $response->viewData('page')['props']['inventories']['data'];
    }

    public function test_a_manager_sees_the_inventories_of_their_shop(): void
    {
        [$owner, $shop] = $this->account();
        $inventory = $this->inventoryIn($shop, $owner);
        $staff = $this->staffOf($shop);

        $response = $this->actingAs($staff)
            ->get(route('inventory.index', ['code_user' => $owner->code_user]))
            ->assertOk();

        $listed = $this->listed($response);
        $this->assertCount(1, $listed);
        $this->assertSame($inventory->id, $listed[0]['id']);
    }

    public function test_a_manager_can_open_the_creation_page_with_products(): void
    {
        [$owner, $shop, $product] = $this->account();
        $staff = $this->staffOf($shop);

        $response = $this->actingAs($staff)
            ->get(route('inventory.create', ['code_user' => $owner->code_user]))
            ->assertOk();

        $products = $response->viewData('page')['props']['products'];
        $this->assertCount(1, $products);
        $this->assertSame($product->id, $products[0]['id']);
    }

    public function test_the_owner_sees_their_own_inventories(): void
    {
        [$owner, $shop] = $this->account();
        $this->inventoryIn($shop, $owner);

        $response = $this->actingAs($owner)
            ->get(route('inventory.index', ['code_user' => $owner->code_user]))
            ->assertOk();

        $this->assertCount(1, $this->listed($response));
    }

    /** Élargir l'accès ne doit pas ouvrir la porte d'à côté. */
    public function test_another_tenants_inventories_are_never_listed(): void
    {
        [$owner, $shop] = $this->account();
        $this->inventoryIn($shop, $owner);

        [$stranger, $strangerShop] = $this->account();
        $this->inventoryIn($strangerShop, $stranger);

        $response = $this->actingAs($owner)
            ->get(route('inventory.index', ['code_user' => $owner->code_user]))
            ->assertOk();

        $listed = $this->listed($response);
        $this->assertCount(1, $listed);
        $this->assertSame($shop->id, $listed[0]['shop_id']);
    }

    public function test_a_manager_cannot_see_another_shops_inventory(): void
    {
        [$owner, $shop] = $this->account();
        [$stranger, $strangerShop] = $this->account();
        $foreign = $this->inventoryIn($strangerShop, $stranger);

        $this->actingAs($this->staffOf($shop))
            ->get(route('inventory.show', ['code_user' => $owner->code_user, 'inventory' => $foreign->id]))
            ->assertForbidden();
    }

    /**
     * Sans boutique, get_active_shop_id() renvoie null. Le service typait `int` : la page
     * tombait sur une TypeError, donc une 500 au lieu d'une liste vide. L'état est atteignable
     * depuis qu'un compte survit à la suppression de sa dernière boutique.
     */
    public function test_the_creation_page_survives_an_account_without_a_shop(): void
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => null]);

        $response = $this->actingAs($user)
            ->get(route('inventory.create', ['code_user' => $user->code_user]))
            ->assertOk();

        $this->assertSame([], $response->viewData('page')['props']['products']);
    }
}
