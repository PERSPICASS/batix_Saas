<?php

namespace Tests\Feature\Shop;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A new shop takes the currency the super_admin configured, not the database default.
 *
 * `shops.currency` defaults to MAD in the schema, and the shop creation form sends no
 * currency at all — so every additional shop came out in dirhams whatever the account's
 * country and whatever its owner had set in Settings. Same shape as the hardcoded country
 * fixed in 39302f1.
 */
class NewShopCurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function owner(string $currency): User
    {
        $shop = Shop::factory()->create(['currency' => $currency]);
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);

        return $user->fresh();
    }

    public function test_an_additional_shop_inherits_the_configured_currency(): void
    {
        $user = $this->owner('XOF');

        // Un abonnement actif est nécessaire pour créer une boutique : sans lui, le
        // middleware refuse avant que le contrôleur ne pose la devise.
        $plan = SubscriptionPlan::factory()->create(['max_shops' => 5]);
        Subscription::create([
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'status' => 'active',
            'amount' => 0,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addYear(),
        ]);

        $this->actingAs($user)
            ->post("/{$user->code_user}/boutiques", ['name' => 'Succursale Yopougon'])
            ->assertSessionHasNoErrors();

        $created = Shop::where('name', 'Succursale Yopougon')->firstOrFail();

        // Et surtout pas MAD, le défaut de la base.
        $this->assertSame('XOF', $created->currency);
    }

    public function test_the_rule_follows_whatever_was_configured(): void
    {
        $user = $this->owner('EUR');

        $this->assertSame('EUR', Shop::defaultCurrencyFor($user));
    }

    /**
     * The user's own shop is the reference, not merely the most recent one on the account
     * — several shops may disagree, and the one they work in is the meaningful answer.
     */
    public function test_the_users_own_shop_wins_over_a_newer_one(): void
    {
        $user = $this->owner('MAD');

        // Une boutique plus récente sur le même compte, dans une autre devise.
        Shop::factory()->create(['user_id' => $user->id, 'currency' => 'USD']);

        $this->assertSame('MAD', Shop::defaultCurrencyFor($user->fresh()));
    }

    /**
     * A brand-new account has nothing to inherit; the fallback applies and stays
     * adjustable in Settings.
     */
    public function test_a_first_shop_falls_back_when_nothing_is_configured(): void
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => null]);

        $this->assertSame('USD', Shop::defaultCurrencyFor($user));
    }
}
