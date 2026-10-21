<?php

namespace Tests\Feature\Subscription;

use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\SubscriptionActivator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Paddle\Http\Middleware\VerifyWebhookSignature;
use Tests\TestCase;

/**
 * Chaque fournisseur de paiement avait sa propre copie de l'activation, et elles
 * avaient divergé. Ces tests fixent les règles communes : on ne perd jamais les
 * jours déjà payés, l'essai ne se reporte pas, et un paiement rejoué n'ouvre pas un
 * second abonnement.
 */
class SubscriptionActivatorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        $this->freezeSecond();
    }

    private function owner(): User
    {
        return User::factory()->create(['role' => 'super_admin']);
    }

    private function subscription(User $user, array $attrs = []): Subscription
    {
        return Subscription::create(array_merge([
            'user_id'              => $user->id,
            'subscription_plan_id' => SubscriptionPlan::factory()->create()->id,
            'status'               => 'active',
            'amount'               => 15000,
            'billing_cycle'        => 'monthly',
            'started_at'           => now()->subDays(25),
            'expires_at'           => now()->addDays(5),
        ], $attrs));
    }

    private function pay(User $user, string $cycle = 'monthly'): ?array
    {
        return app(SubscriptionActivator::class)->activatePaid(
            $user, SubscriptionPlan::factory()->create(), $cycle, 15000, 'chariow'
        );
    }

    /** Payer au 25ᵉ jour faisait repartir d'aujourd'hui : 5 jours payés perdus. */
    public function test_paying_early_keeps_the_days_already_paid(): void
    {
        $user = $this->owner();
        $current = $this->subscription($user);

        [$new] = $this->pay($user);

        $this->assertTrue($new->expires_at->equalTo(now()->addDays(5)->addMonth()));
        $this->assertSame('cancelled', $current->fresh()->status);
        $this->assertSame('active', $new->status);
        $this->assertTrue($user->fresh()->activeSubscription()->is($new));
    }

    public function test_a_yearly_payment_also_extends_from_the_current_end(): void
    {
        $user = $this->owner();
        $this->subscription($user);

        [$new] = $this->pay($user, 'yearly');

        $this->assertTrue($new->expires_at->equalTo(now()->addDays(5)->addMonths(12)));
    }

    /** L'essai ne se reporte pas, et il ne reste pas ouvert à côté de l'abonnement payé. */
    public function test_the_trial_is_closed_and_not_carried_over(): void
    {
        $user = $this->owner();
        $trial = $this->subscription($user, ['status' => 'trial', 'amount' => 0, 'trial_ends_at' => now()->addDays(5)]);

        [$new] = $this->pay($user);

        $this->assertTrue($new->expires_at->equalTo(now()->addMonth()));
        $this->assertSame('cancelled', $trial->fresh()->status);
    }

    /** Un abonnement échu (même dans son délai de grâce) ne donne aucun jour à reporter. */
    public function test_an_expired_subscription_starts_the_new_one_from_today(): void
    {
        $user = $this->owner();
        $this->subscription($user, ['expires_at' => now()->subDays(2)]);

        [$new] = $this->pay($user);

        $this->assertTrue($new->expires_at->equalTo(now()->addMonth()));
    }

    public function test_a_refused_claim_creates_nothing(): void
    {
        $user = $this->owner();

        $result = app(SubscriptionActivator::class)->activatePaid(
            $user, SubscriptionPlan::factory()->create(), 'monthly', 15000, 'paddle', claim: fn () => false
        );

        $this->assertNull($result);
        $this->assertSame(0, Subscription::count());
        $this->assertSame(0, SubscriptionInvoice::count());
        Mail::assertNothingSent();
    }

    public function test_admin_activation_of_a_manual_payment_keeps_the_days_left(): void
    {
        $user = $this->owner();
        $current = $this->subscription($user);
        $pending = $this->subscription($user, ['status' => 'pending', 'started_at' => null, 'expires_at' => null]);
        SubscriptionInvoice::create([
            'subscription_id' => $pending->id,
            'user_id'         => $user->id,
            'invoice_number'  => SubscriptionInvoice::generateInvoiceNumber(),
            'amount'          => 15000,
            'tax'             => 0,
            'total'           => 15000,
            'status'          => 'pending',
            'issued_at'       => now(),
            'due_at'          => now()->addDays(3),
            'payment_method'  => 'wave',
        ]);

        $this->actingAs(User::factory()->create(['role' => 'admin_platforme']))
            ->post(route('platform.active-subscriptions.activate', $pending));

        $pending->refresh();
        $this->assertSame('active', $pending->status);
        $this->assertTrue($pending->expires_at->equalTo(now()->addDays(5)->addMonth()));
        $this->assertSame('cancelled', $current->fresh()->status);
        $this->assertSame('paid', $pending->invoices()->first()->status);
    }

    private function paddleEvent(User $user, SubscriptionPlan $plan): array
    {
        return [
            'event_type' => 'transaction.completed',
            'data'       => [
                'id'          => 'txn_123',
                'custom_data' => ['user_id' => $user->id, 'plan_slug' => $plan->slug, 'billing_cycle' => 'monthly'],
            ],
        ];
    }

    public function test_a_replayed_paddle_webhook_activates_only_once(): void
    {
        $this->withoutMiddleware(VerifyWebhookSignature::class);
        $user = $this->owner();
        $plan = SubscriptionPlan::factory()->create(['price' => 15000]);

        $this->postJson('/paddle/webhook', $this->paddleEvent($user, $plan))->assertJson(['status' => 'ok']);
        $this->postJson('/paddle/webhook', $this->paddleEvent($user, $plan))->assertJson(['status' => 'already_processed']);

        $this->assertSame(1, Subscription::where('user_id', $user->id)->count());
        $this->assertSame(1, SubscriptionInvoice::count());
        $this->assertSame('txn_123', Subscription::first()->metadata['paddle_transaction_id']);
    }
}
