<?php

namespace Tests\Feature\Subscription;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A staff user's only link to an account is `shop_id` -> `shop.user_id`, so a user
 * created without a shop belongs to nobody: it escapes the plan's user quota (counted
 * via whereHas('shop')), never shows in the users list, and can no longer be edited or
 * deleted (those guards require the target's shop to be one of the caller's).
 */
class UserQuotaBypassTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop} */
    private function ownerOnPlanWithMaxUsers(int $maxUsers): array
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $owner->id]);

        $plan = SubscriptionPlan::factory()->create(['max_users' => $maxUsers, 'price' => 10]);

        Subscription::create([
            'user_id' => $owner->id,
            'subscription_plan_id' => $plan->id,
            'status' => 'active',
            'started_at' => now(),
            'expires_at' => now()->addYear(),
            'amount' => 10,
            'billing_cycle' => 'monthly',
        ]);

        return [$owner, $shop];
    }

    public function test_quota_blocks_creating_users_beyond_the_plan_limit(): void
    {
        [$owner, $shop] = $this->ownerOnPlanWithMaxUsers(2);

        // The owner counts as 1, so a max_users=2 plan allows exactly one more.
        User::factory()->create(['role' => 'cashier', 'shop_id' => $shop->id]);

        $this->assertFalse($owner->fresh()->canCreateUser());
    }

    /**
     * The exploit: leaving shop_id empty produced users the quota could not see, so the
     * limit never filled up.
     */
    public function test_owner_cannot_create_shopless_users_to_dodge_the_quota(): void
    {
        [$owner] = $this->ownerOnPlanWithMaxUsers(2);

        $created = 0;
        for ($i = 0; $i < 3; $i++) {
            $this->actingAs($owner)->post("/{$owner->code_user}/users", [
                'name' => "Ghost {$i}",
                'email' => "ghost{$i}@example.com",
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'cashier',
                'shop_id' => null,
                'is_active' => true,
            ]);

            if (User::where('email', "ghost{$i}@example.com")->exists()) {
                $created++;
            }
        }

        $this->assertSame(0, $created, 'a staff user must never be created without a shop');
    }

    /**
     * The manager path was orphaning every single user: the shop select is disabled for
     * non-owners ("Seul un super admin peut assigner une boutique"), so the form always
     * submitted an empty shop_id and nothing filled it in server-side.
     */
    public function test_manager_created_users_are_attached_to_the_managers_own_shop(): void
    {
        [$owner, $shop] = $this->ownerOnPlanWithMaxUsers(10);

        $manager = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);
        foreach (UserPermission::defaultsForRole('manager') as $module => $actions) {
            UserPermission::create(['user_id' => $manager->id, 'module' => $module] + $actions);
        }

        $this->actingAs($manager)->post("/{$owner->code_user}/users", [
            'name' => 'Caissier',
            'email' => 'caissier@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'cashier',
            'shop_id' => null,
            'is_active' => true,
        ]);

        $created = User::where('email', 'caissier@example.com')->first();

        $this->assertNotNull($created, 'the manager must still be able to create users');
        $this->assertSame($shop->id, $created->shop_id, "the new user joins the manager's shop");
    }

    /**
     * A manager must not be able to smuggle a user into another shop by posting a
     * shop_id the UI never offered them.
     */
    public function test_manager_cannot_place_a_user_in_another_shop_via_shop_id(): void
    {
        [$owner, $shop] = $this->ownerOnPlanWithMaxUsers(10);
        $otherShop = Shop::factory()->create(['user_id' => $owner->id]);

        $manager = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);
        foreach (UserPermission::defaultsForRole('manager') as $module => $actions) {
            UserPermission::create(['user_id' => $manager->id, 'module' => $module] + $actions);
        }

        $this->actingAs($manager)->post("/{$owner->code_user}/users", [
            'name' => 'Smuggled',
            'email' => 'smuggled@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'cashier',
            'shop_id' => $otherShop->id,
            'is_active' => true,
        ]);

        $created = User::where('email', 'smuggled@example.com')->first();

        $this->assertNotNull($created);
        $this->assertSame($shop->id, $created->shop_id, "a submitted shop_id must not override the manager's own shop");
    }

    /**
     * The owner keeps the ability to place staff in a chosen shop.
     */
    public function test_owner_can_still_create_a_user_in_a_chosen_shop(): void
    {
        [$owner, $shop] = $this->ownerOnPlanWithMaxUsers(10);

        $this->actingAs($owner)->post("/{$owner->code_user}/users", [
            'name' => 'Vendeur',
            'email' => 'vendeur@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'cashier',
            'shop_id' => $shop->id,
            'is_active' => true,
        ]);

        $created = User::where('email', 'vendeur@example.com')->first();

        $this->assertNotNull($created);
        $this->assertSame($shop->id, $created->shop_id);
    }
}
