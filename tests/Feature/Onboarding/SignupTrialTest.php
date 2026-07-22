<?php

namespace Tests\Feature\Onboarding;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The signup funnel is the whole acquisition pitch: "essai gratuit 14 jours, sans
 * carte bancaire". Everything downstream — the field demo, the WhatsApp script, the
 * J-7/J-1 expiry reminders — assumes a prospect who signs up ends up with a working
 * 14-day trial. These tests pin that promise down.
 */
class SignupTrialTest extends TestCase
{
    use RefreshDatabase;

    private function freePlan(): SubscriptionPlan
    {
        // Mirrors database/seeders/SubscriptionPlanSeeder: the Free plan is the only
        // one looked up by slug at signup, and it is seeded is_active => false.
        return SubscriptionPlan::factory()->create([
            'name' => 'Free',
            'slug' => 'free',
            'price' => 0,
            'max_shops' => 1,
            'max_users' => 2,
            'is_active' => false,
        ]);
    }

    private function verifiedUserWithoutShop(): User
    {
        return User::factory()->create([
            'role' => 'super_admin',
            'shop_id' => null,
            'email_verified_at' => now(),
        ]);
    }

    public function test_a_new_signup_gets_a_14_day_trial(): void
    {
        $this->freePlan();
        $user = $this->verifiedUserWithoutShop();

        $this->actingAs($user)
            ->post('/create-shop', ['name' => 'Quincaillerie Test'])
            ->assertRedirect();

        $subscription = Subscription::where('user_id', $user->id)->first();

        $this->assertNotNull($subscription, 'Signup must create a subscription.');
        $this->assertSame('trial', $subscription->status);
        $this->assertNotNull($subscription->trial_ends_at);
        $this->assertSame(
            14,
            (int) now()->startOfDay()->diffInDays($subscription->trial_ends_at->startOfDay()),
            'The trial must last the 14 days advertised on the homepage.'
        );
        $this->assertEquals(0, $subscription->amount, 'The trial must not charge anything.');
    }

    public function test_the_shop_and_its_owner_are_wired_together(): void
    {
        $this->freePlan();
        $user = $this->verifiedUserWithoutShop();

        $this->actingAs($user)->post('/create-shop', ['name' => 'Quincaillerie Adjame']);

        $shop = Shop::where('user_id', $user->id)->first();

        $this->assertNotNull($shop, 'The first shop must be created.');
        // Without this the owner is the "ghost user" case: attached to no shop,
        // invisible to the users list and uncountable against the plan quota.
        $this->assertSame($shop->id, $user->fresh()->shop_id);
        $this->assertGreaterThan(0, $user->permissions()->count(), 'The owner must get their module permissions.');
    }

    /**
     * The failure mode worth knowing about before any prospecting trip.
     *
     * ShopController::storeInitial wraps the whole subscription block in
     * `if ($freePlan)`. If the row is missing from the production database the shop
     * is still created, the request still succeeds, the user still lands on the
     * dashboard — and they simply have no trial. Nothing logs, nothing warns.
     */
    public function test_without_the_free_plan_row_the_signup_silently_grants_no_trial(): void
    {
        // Deliberately no free plan seeded.
        $user = $this->verifiedUserWithoutShop();

        $this->actingAs($user)
            ->post('/create-shop', ['name' => 'Quincaillerie Sans Plan'])
            ->assertRedirect();

        $this->assertNotNull(Shop::where('user_id', $user->id)->first(), 'The shop is created either way.');
        $this->assertNull(
            Subscription::where('user_id', $user->id)->first(),
            'Documents the silent failure: no free plan row means no trial, with no error surfaced.'
        );
    }

    public function test_an_unverified_email_cannot_create_the_first_shop(): void
    {
        $this->freePlan();
        $user = User::factory()->create([
            'role' => 'super_admin',
            'shop_id' => null,
            'email_verified_at' => null,
        ]);

        $this->actingAs($user)->post('/create-shop', ['name' => 'Quincaillerie Non Verifiee']);

        $this->assertNull(Shop::where('user_id', $user->id)->first());
        $this->assertNull(Subscription::where('user_id', $user->id)->first());
    }
}
