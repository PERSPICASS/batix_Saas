<?php

namespace Tests\Feature\Subscription;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le propriétaire compte UNE fois dans la limite d'utilisateurs : il a lui aussi un
 * `shop_id`, et l'ancien calcul l'ajoutait une seconde fois — un plan à 2 utilisateurs
 * n'admettait alors aucun employé.
 */
class UserLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_two_user_plan_admits_the_owner_and_one_employee(): void
    {
        $shop = Shop::factory()->create();
        $owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $owner->id]);
        $plan = SubscriptionPlan::factory()->create(['max_shops' => 1, 'max_users' => 2, 'max_products' => -1, 'max_depots' => 0]);
        Subscription::create([
            'user_id' => $owner->id, 'subscription_plan_id' => $plan->id, 'status' => 'active',
            'started_at' => now(), 'expires_at' => now()->addMonth(), 'amount' => 0,
        ]);

        $limits = $owner->fresh()->getSubscriptionLimits();
        $this->assertSame(1, $limits['current_users']);
        $this->assertTrue($owner->fresh()->canCreateUser());
        $this->assertSame(1, $owner->fresh()->remainingUserSlots());

        $this->actingAs($owner)->post("/{$owner->code_user}/users", [
            'name' => 'Vendeur', 'email' => 'vendeur@example.com',
            'password' => 'password123', 'password_confirmation' => 'password123',
            'role' => 'cashier', 'shop_id' => $shop->id, 'is_active' => true,
        ])->assertSessionMissing('error');

        $this->assertSame(2, User::where('shop_id', $shop->id)->count());
        $this->assertFalse($owner->fresh()->canCreateUser());
        $this->assertSame(0, $owner->fresh()->remainingUserSlots());
    }
}
