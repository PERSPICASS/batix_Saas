<?php

namespace Tests\Feature\Onboarding;

use App\Models\Shop;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The country a user picks at registration must become the default country of
 * the shop(s) they create — not a hardcoded "Maroc".
 */
class ShopCountryDefaultTest extends TestCase
{
    use RefreshDatabase;

    private function freePlan(): void
    {
        SubscriptionPlan::factory()->create([
            'name' => 'Free', 'slug' => 'free', 'price' => 0,
            'max_shops' => 1, 'max_users' => 2, 'is_active' => false,
        ]);
    }

    private function verifiedUserFrom(string $country): User
    {
        return User::factory()->create([
            'role' => 'super_admin',
            'shop_id' => null,
            'country' => $country,
            'email_verified_at' => now(),
        ]);
    }

    public function test_the_onboarding_shop_uses_the_users_country(): void
    {
        $this->freePlan();
        $user = $this->verifiedUserFrom('Sénégal');

        $this->actingAs($user)->post('/create-shop', ['name' => 'Quincaillerie Dakar']);

        $shop = Shop::where('user_id', $user->id)->first();
        $this->assertSame('Sénégal', $shop->country);
    }

    public function test_the_onboarding_shop_falls_back_when_the_user_has_no_country(): void
    {
        $this->freePlan();
        $user = User::factory()->create([
            'role' => 'super_admin', 'shop_id' => null,
            'country' => null, 'email_verified_at' => now(),
        ]);

        $this->actingAs($user)->post('/create-shop', ['name' => 'Boutique Sans Pays']);

        // No country on the account → a sane non-null fallback, never a crash
        // (shops.country is NOT NULL).
        $shop = Shop::where('user_id', $user->id)->first();
        $this->assertNotNull($shop->country);
        $this->assertNotSame('Maroc', $shop->country);
    }
}
