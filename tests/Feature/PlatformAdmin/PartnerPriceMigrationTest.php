<?php

namespace Tests\Feature\PlatformAdmin;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartnerPriceMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_applies_the_partner_price_and_the_demo_flag_only_to_those_accounts(): void
    {
        $growth = SubscriptionPlan::factory()->create(['slug' => 'growth', 'price' => 35000]);

        $partner = User::factory()->create(['role' => 'super_admin', 'code_user' => 'TUXWB4ZHQV']);
        $current = Subscription::create(['user_id' => $partner->id, 'subscription_plan_id' => $growth->id, 'status' => 'active', 'amount' => 35000, 'billing_cycle' => 'monthly', 'started_at' => now()->subDays(5), 'expires_at' => now()->addDays(25)]);
        $past = Subscription::create(['user_id' => $partner->id, 'subscription_plan_id' => $growth->id, 'status' => 'cancelled', 'amount' => 35000, 'billing_cycle' => 'monthly', 'started_at' => now()->subMonths(3), 'cancelled_at' => now()->subMonth()]);

        $other = User::factory()->create(['role' => 'super_admin']);
        $untouched = Subscription::create(['user_id' => $other->id, 'subscription_plan_id' => $growth->id, 'status' => 'active', 'amount' => 35000, 'billing_cycle' => 'monthly', 'started_at' => now(), 'expires_at' => now()->addMonth()]);

        $demo = User::factory()->create(['role' => 'super_admin', 'code_user' => '7L6NZR3DGY']);

        (require database_path('migrations/2026_10_16_130000_apply_partner_price_and_demo_account.php'))->up();

        $this->assertEqualsWithDelta(15000, (float) $current->fresh()->amount, 0.01);
        $this->assertEqualsWithDelta(35000, (float) $past->fresh()->amount, 0.01, "L'historique n'est pas réécrit.");
        $this->assertEqualsWithDelta(35000, (float) $untouched->fresh()->amount, 0.01, 'Les autres comptes ne bougent pas.');
        $this->assertTrue((bool) $demo->fresh()->is_demo);
        $this->assertFalse((bool) $other->fresh()->is_demo);
    }
}
