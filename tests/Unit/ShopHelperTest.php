<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class ShopHelperTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function get_active_shop_returns_null_when_no_session(): void
    {
        $this->assertNull(get_active_shop());
    }

    #[Test]
    public function get_active_shop_id_returns_null_when_no_session(): void
    {
        $this->assertNull(get_active_shop_id());
    }

    #[Test]
    public function get_active_shop_returns_shop_from_session(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        // Authentifier l'utilisateur
        $this->actingAs($user);
        session(['active_shop_id' => $shop->id]);

        $activeShop = get_active_shop();

        $this->assertNotNull($activeShop);
        $this->assertEquals($shop->id, $activeShop->id);
        $this->assertEquals($shop->name, $activeShop->name);
    }

    #[Test]
    public function get_active_shop_id_returns_id_from_session(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        session(['active_shop_id' => $shop->id]);

        $activeShopId = get_active_shop_id();

        $this->assertEquals($shop->id, $activeShopId);
    }

    #[Test]
    public function get_active_shop_handles_invalid_shop_id(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        session(['active_shop_id' => 99999]); // ID qui n'existe pas

        $activeShop = get_active_shop();

        $this->assertNull($activeShop);
    }

    #[Test]
    public function accessible_shops_returns_user_shops(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop1 = Shop::factory()->create(['user_id' => $user->id, 'name' => 'Shop A']);
        $shop2 = Shop::factory()->create(['user_id' => $user->id, 'name' => 'Shop B']);

        $otherUser = User::factory()->create(['role' => 'super_admin']);
        $otherShop = Shop::factory()->create(['user_id' => $otherUser->id, 'name' => 'Other Shop']);

        $accessibleShops = $user->accessibleShops();

        $this->assertCount(2, $accessibleShops);
        $this->assertTrue($accessibleShops->contains($shop1));
        $this->assertTrue($accessibleShops->contains($shop2));
        $this->assertFalse($accessibleShops->contains($otherShop));
    }

    #[Test]
    public function accessible_shops_returns_empty_for_user_without_shops(): void
    {
        $user = User::factory()->create(['shop_id' => null]);

        $accessibleShops = $user->accessibleShops();

        $this->assertCount(0, $accessibleShops);
    }
}
