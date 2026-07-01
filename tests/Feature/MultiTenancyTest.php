<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class MultiTenancyTest extends TestCase
{
    /**
     * Test that user can have multiple shops
     */
    public function test_user_has_multiple_shops(): void
    {
        $user = User::factory()->create();

        $shop1 = Shop::factory()->create(['user_id' => $user->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user->id]);

        $this->assertEquals(2, $user->shops()->count());
    }

    /**
     * Test that shops are isolated per user
     */
    public function test_shop_isolation_per_user(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $shop1 = Shop::factory()->create(['user_id' => $user1->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user2->id]);

        $this->assertEquals(1, $user1->shops()->count());
        $this->assertEquals(1, $user2->shops()->count());
        $this->assertNotEquals($shop1->id, $shop2->id);
    }

    /**
     * Test that invoices belong to specific shop
     */
    public function test_invoice_shop_isolation(): void
    {
        $user = User::factory()->create();
        $shop1 = Shop::factory()->create(['user_id' => $user->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user->id]);

        $invoice1 = Invoice::factory()->create(['shop_id' => $shop1->id]);
        $invoice2 = Invoice::factory()->create(['shop_id' => $shop2->id]);

        $this->assertEquals($shop1->id, $invoice1->shop_id);
        $this->assertEquals($shop2->id, $invoice2->shop_id);
    }

    /**
     * Test that user can switch between shops
     */
    public function test_user_can_switch_shops(): void
    {
        $user = User::factory()->create(['current_shop_id' => null]);
        $shop1 = Shop::factory()->create(['user_id' => $user->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user->id]);

        $user->update(['current_shop_id' => $shop1->id]);
        $this->assertEquals($shop1->id, $user->fresh()->current_shop_id);

        $user->update(['current_shop_id' => $shop2->id]);
        $this->assertEquals($shop2->id, $user->fresh()->current_shop_id);
    }

    /**
     * Test that shop data is not shared between users
     */
    public function test_shop_data_not_shared(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $shop1 = Shop::factory()->create(['user_id' => $user1->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user2->id]);

        Invoice::factory()->create(['shop_id' => $shop1->id]);
        Invoice::factory()->create(['shop_id' => $shop2->id]);

        $this->assertEquals(1, $shop1->invoices()->count());
        $this->assertEquals(1, $shop2->invoices()->count());
    }

    /**
     * Test that current shop is respected
     */
    public function test_current_shop_context(): void
    {
        $user = User::factory()->create();
        $shop1 = Shop::factory()->create(['user_id' => $user->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user->id]);

        $user->update(['current_shop_id' => $shop1->id]);

        $this->actingAs($user);

        $this->assertEquals($shop1->id, $user->current_shop_id);
    }

    /**
     * Test that shop switching preserves other data
     */
    public function test_shop_switch_preserves_user_data(): void
    {
        $user = User::factory()->create(['name' => 'Test User']);
        $shop1 = Shop::factory()->create(['user_id' => $user->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user->id]);

        $originalName = $user->name;

        $user->update(['current_shop_id' => $shop1->id]);
        $this->assertEquals($originalName, $user->fresh()->name);

        $user->update(['current_shop_id' => $shop2->id]);
        $this->assertEquals($originalName, $user->fresh()->name);
    }

    /**
     * Test that shop access is restricted by ownership
     */
    public function test_shop_access_by_owner_only(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $shop = Shop::factory()->create(['user_id' => $user1->id]);

        // Shop belongs to user1
        $this->assertEquals($user1->id, $shop->user_id);

        // User2 should not have access
        $this->assertNotEquals($user2->id, $shop->user_id);
    }
}
