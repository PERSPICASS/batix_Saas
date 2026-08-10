<?php

namespace Tests\Feature\Subscription;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le bouton « plan gratuit » créait un abonnement `active` avec `expires_at = null`.
 * activeSubscription() lit une date nulle comme « n'expire jamais » : tout compte passé
 * par ce bouton devenait immunisé à vie — jamais de rappel, jamais de lecture seule,
 * quelle que soit l'ancienneté de son essai.
 */
class FreePlanActivationTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: SubscriptionPlan} */
    private function accountAndFreePlan(): array
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        Shop::factory()->create(['user_id' => $owner->id]);
        Subscription::query()->delete();

        $plan = SubscriptionPlan::factory()->create(['price' => 0, 'slug' => 'free', 'is_active' => true]);

        return [$owner, $plan];
    }

    private function activate(User $owner, SubscriptionPlan $plan)
    {
        return $this->actingAs($owner)->post("/plans/{$plan->slug}/process", [
            'payment_method' => 'wave',
            'billing_cycle'  => 'monthly',
        ]);
    }

    public function test_the_free_plan_expires_instead_of_lasting_forever(): void
    {
        [$owner, $plan] = $this->accountAndFreePlan();

        $this->activate($owner, $plan);

        $subscription = Subscription::sole();

        $this->assertNotNull(
            $subscription->expires_at,
            "Sans date d'expiration, l'abonnement est éternel et échappe à la lecture seule."
        );
        $this->assertSame(14, (int) round(now()->diffInDays($subscription->expires_at, false)));
    }

    /** Un essai épuisé se relançait indéfiniment : le bouton restait cliquable. */
    public function test_the_free_trial_cannot_be_claimed_twice(): void
    {
        [$owner, $plan] = $this->accountAndFreePlan();

        $this->activate($owner, $plan);
        $this->activate($owner, $plan)->assertSessionHas('error');

        $this->assertSame(1, Subscription::count());
    }

    /** Une fois l'essai réellement fini, le compte retombe bien en lecture seule. */
    public function test_an_expired_free_plan_no_longer_grants_access(): void
    {
        [$owner, $plan] = $this->accountAndFreePlan();

        $this->activate($owner, $plan);

        $this->travel(15 + User::SUBSCRIPTION_GRACE_PERIOD_DAYS)->days();

        $this->assertNull($owner->fresh()->activeSubscription());
    }
}
