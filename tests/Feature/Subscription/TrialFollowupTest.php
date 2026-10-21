<?php

namespace Tests\Feature\Subscription;

use App\Console\Commands\SendTrialFollowups;
use App\Mail\TrialFollowupMail;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Un compte dont l'essai de 14 jours finissait sans paiement ne recevait plus
 * jamais rien : le seul rappel existant (J-7, J-1) part AVANT l'échéance.
 */
class TrialFollowupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    /** Un compte dont l'essai gratuit s'est terminé il y a $daysAgo jours. */
    private function expiredTrial(int $daysAgo, array $userAttrs = []): User
    {
        $owner = User::factory()->create(array_merge(['role' => 'super_admin'], $userAttrs));
        Shop::factory()->create(['user_id' => $owner->id]);
        Subscription::where('user_id', $owner->id)->delete();

        Subscription::create([
            'user_id' => $owner->id,
            'subscription_plan_id' => SubscriptionPlan::factory()->free()->create()->id,
            'status' => 'trial',
            'amount' => 0,
            'started_at' => now()->subDays($daysAgo + 14),
            'expires_at' => now()->subDays($daysAgo),
            'trial_ends_at' => now()->subDays($daysAgo),
        ]);

        return $owner;
    }

    private function run_(): void
    {
        $this->artisan('trials:send-followups')->assertSuccessful();
    }

    public function test_the_steps_and_their_windows(): void
    {
        $this->assertNull(SendTrialFollowups::dueStep(0));
        $this->assertSame(1, SendTrialFollowups::dueStep(1));
        $this->assertSame(1, SendTrialFollowups::dueStep(2));
        $this->assertSame(3, SendTrialFollowups::dueStep(3));
        $this->assertSame(7, SendTrialFollowups::dueStep(10));
        $this->assertSame(14, SendTrialFollowups::dueStep(29));
        $this->assertSame(30, SendTrialFollowups::dueStep(36));
        $this->assertNull(SendTrialFollowups::dueStep(37), "Après J+36, plus jamais d'email.");
        $this->assertNull(SendTrialFollowups::dueStep(200));
    }

    public function test_an_expired_trial_gets_the_step_due_once(): void
    {
        $owner = $this->expiredTrial(3);

        $this->run_();
        $this->run_(); // même jour : pas de doublon

        Mail::assertSent(TrialFollowupMail::class, 1);
        Mail::assertSent(TrialFollowupMail::class, fn ($m) => $m->hasTo($owner->email) && $m->step === 3);
        $this->assertSame(1, DB::table('trial_followups')->where('user_id', $owner->id)->count());
    }

    public function test_missed_steps_are_not_sent_in_a_burst(): void
    {
        $owner = $this->expiredTrial(15); // J+1, 3 et 7 ratés : seule l'étape courante part

        $this->run_();

        Mail::assertSent(TrialFollowupMail::class, 1);
        Mail::assertSent(TrialFollowupMail::class, fn ($m) => $m->step === 14);
    }

    public function test_an_old_expired_trial_is_left_alone(): void
    {
        $this->expiredTrial(120);

        $this->run_();

        Mail::assertNothingSent();
    }

    public function test_a_trial_that_has_not_ended_gets_nothing(): void
    {
        $this->expiredTrial(-3); // se termine dans 3 jours

        $this->run_();

        Mail::assertNothingSent();
    }

    public function test_an_account_that_has_paid_is_not_a_trial_follow_up(): void
    {
        $owner = $this->expiredTrial(3);
        Subscription::create([
            'user_id' => $owner->id,
            'subscription_plan_id' => SubscriptionPlan::factory()->create()->id,
            'status' => 'active',
            'amount' => 15000,
            'billing_cycle' => 'monthly',
            'started_at' => now()->subDay(),
            'expires_at' => now()->addMonth(),
        ]);

        $this->run_();

        Mail::assertNothingSent();
    }

    /** Payé puis parti : c'est un départ, pas un essai à relancer. */
    public function test_a_former_paying_customer_is_not_treated_as_a_trial(): void
    {
        $owner = $this->expiredTrial(3);
        Subscription::create([
            'user_id' => $owner->id,
            'subscription_plan_id' => SubscriptionPlan::factory()->create()->id,
            'status' => 'cancelled',
            'amount' => 15000,
            'billing_cycle' => 'monthly',
            'started_at' => now()->subMonths(2),
            'expires_at' => now()->subMonth(),
            'cancelled_at' => now()->subMonth(),
        ]);

        $this->run_();

        Mail::assertNothingSent();
    }

    public function test_a_pending_manual_payment_pauses_the_follow_ups(): void
    {
        $owner = $this->expiredTrial(3);
        Subscription::create([
            'user_id' => $owner->id,
            'subscription_plan_id' => SubscriptionPlan::factory()->create()->id,
            'status' => 'pending',
            'amount' => 15000,
            'billing_cycle' => 'monthly',
        ]);

        $this->run_();

        Mail::assertNothingSent();
    }

    public function test_demo_suspended_and_unsubscribed_accounts_are_skipped(): void
    {
        $demo = $this->expiredTrial(3);
        $demo->forceFill(['is_demo' => true])->save();

        $this->expiredTrial(3, ['is_active' => false]);

        $out = $this->expiredTrial(3);
        $out->forceFill(['trial_followups_opted_out_at' => now()])->save();

        $this->run_();

        Mail::assertNothingSent();
    }

    public function test_the_unsubscribe_link_works_and_cannot_be_forged(): void
    {
        $owner = $this->expiredTrial(3);
        $path = parse_url(TrialFollowupMail::unsubscribeUrl($owner));
        $signed = $path['path'].'?'.$path['query'];

        $this->get($path['path'])->assertForbidden(); // sans signature

        $other = $this->expiredTrial(3);
        $this->get(str_replace("/{$owner->id}?", "/{$other->id}?", $signed))->assertForbidden(); // id changé

        $this->get($signed)->assertOk();
        $this->assertNotNull($owner->fresh()->trial_followups_opted_out_at);
        $this->assertNull($other->fresh()->trial_followups_opted_out_at);
    }

    public function test_the_email_renders_in_the_accounts_language(): void
    {
        $owner = $this->expiredTrial(7, ['locale' => 'en']);

        $html = (new TrialFollowupMail($owner, 7, 12, 3))->render();

        $this->assertStringContainsString('We can help you get started', $html);
        $this->assertStringContainsString('<strong>12 product(s)</strong>', $html);
        $this->assertStringContainsString('wa.me/', $html);
    }
}
