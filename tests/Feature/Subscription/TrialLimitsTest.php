<?php

namespace Tests\Feature\Subscription;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Un essai peut recevoir, à lui seul, plus de boutiques et d'utilisateurs que son plan
 * (`subscription:grant-trial-limits`) — sans toucher le plan ni les autres essais.
 */
class TrialLimitsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;
    private Subscription $trial;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);

        // Le plan d'essai : 1 boutique, 2 utilisateurs.
        $free = SubscriptionPlan::factory()->create(['max_shops' => 1, 'max_users' => 2, 'max_products' => -1, 'max_depots' => 0]);
        $this->trial = Subscription::create([
            'user_id' => $this->owner->id, 'subscription_plan_id' => $free->id, 'status' => 'trial',
            'started_at' => now(), 'expires_at' => now()->addDays(14), 'amount' => 0,
        ]);
    }

    private function grant(array $options = ['--shops' => 2, '--users-per-shop' => 3]): void
    {
        $this->artisan('subscription:grant-trial-limits', ['code_user' => $this->owner->code_user] + $options)->assertSuccessful();
    }

    private function createUser(?Shop $shop = null)
    {
        static $n = 0;
        $n++;

        return $this->actingAs($this->owner)->post("/{$this->owner->code_user}/users", [
            'name' => "Vendeur {$n}", 'email' => "vendeur{$n}@example.com",
            'password' => 'password123', 'password_confirmation' => 'password123',
            'role' => 'cashier', 'shop_id' => ($shop ?? $this->shop)->id, 'is_active' => true,
        ]);
    }

    public function test_without_a_grant_the_trial_keeps_its_plan(): void
    {
        $this->assertFalse($this->owner->fresh()->canCreateShop());
        $this->assertSame(1, $this->owner->fresh()->getSubscriptionLimits()['max_shops']);
    }

    public function test_the_grant_allows_a_second_shop_but_not_a_third(): void
    {
        $this->grant();

        $this->assertTrue($this->owner->fresh()->canCreateShop());
        Shop::factory()->create(['user_id' => $this->owner->id]);
        $this->assertFalse($this->owner->fresh()->canCreateShop());
    }

    public function test_three_users_per_shop_then_the_shop_is_full(): void
    {
        $this->grant();
        $second = Shop::factory()->create(['user_id' => $this->owner->id]);

        foreach (range(1, 3) as $i) {
            $this->createUser()->assertSessionHasNoErrors()->assertSessionMissing('error');
        }
        $this->createUser()->assertSessionHas('error');
        $this->assertSame(3, User::where('shop_id', $this->shop->id)->where('id', '!=', $this->owner->id)->count());

        // L'autre boutique a encore ses trois places.
        $this->createUser($second)->assertSessionMissing('error');
        $this->assertSame(2, $this->owner->fresh()->getSubscriptionLimits()['remaining_users']);
    }

    public function test_moving_a_user_into_a_full_shop_is_refused(): void
    {
        $this->grant();
        $second = Shop::factory()->create(['user_id' => $this->owner->id]);
        foreach (range(1, 3) as $i) {
            $this->createUser();
        }
        $this->createUser($second);
        $mover = User::where('shop_id', $second->id)->sole();

        $this->actingAs($this->owner)->put("/{$this->owner->code_user}/users/{$mover->id}", [
            'name' => $mover->name, 'email' => $mover->email, 'role' => 'cashier',
            'shop_id' => $this->shop->id, 'is_active' => true,
        ])->assertSessionHas('error');

        $this->assertSame($second->id, $mover->fresh()->shop_id);
    }

    public function test_the_grant_ends_when_the_trial_is_paid(): void
    {
        $this->grant();
        $this->trial->update(['status' => 'active']);

        $this->assertFalse($this->owner->fresh()->canCreateShop(), 'Payé, le compte suit son plan.');
        $this->assertNull($this->owner->fresh()->getSubscriptionLimits()['max_users_per_shop']);
    }

    public function test_only_a_trial_can_receive_a_grant(): void
    {
        $this->trial->update(['status' => 'active']);

        $this->artisan('subscription:grant-trial-limits', ['code_user' => $this->owner->code_user, '--shops' => 2])->assertFailed();
        $this->assertNull($this->trial->fresh()->metadata);
    }

    public function test_the_grant_can_be_cleared(): void
    {
        $this->grant();
        $this->grant(['--clear' => true]);

        $this->assertFalse($this->owner->fresh()->canCreateShop());
    }
}
