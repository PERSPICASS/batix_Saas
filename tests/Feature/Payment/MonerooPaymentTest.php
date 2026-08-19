<?php

namespace Tests\Feature\Payment;

use App\Models\MonerooPayment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MonerooPaymentTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'moneroo_webhook_test_secret';

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config([
            'services.moneroo.enabled' => true,
            'services.moneroo.api_key' => 'sk_test_moneroo',
            'services.moneroo.webhook_secret' => self::SECRET,
            'services.moneroo.base_url' => 'https://api.moneroo.io',
        ]);
    }

    private function plan(array $attributes = []): SubscriptionPlan
    {
        return SubscriptionPlan::factory()->create(array_merge([
            'price' => 15000,
            'is_active' => true,
        ], $attributes));
    }

    private function payment(User $user, SubscriptionPlan $plan, array $attributes = []): MonerooPayment
    {
        return MonerooPayment::create(array_merge([
            'payment_id' => 'pay_test_123',
            'reference' => 'BTX-TEST-REFERENCE',
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'status' => 'initiated',
            'amount' => 15000,
            'currency' => 'XOF',
            'checkout_url' => 'https://checkout.moneroo.io/pay_test_123',
        ], $attributes));
    }

    private function verification(MonerooPayment $payment, array $overrides = []): array
    {
        return array_replace_recursive([
            'success' => true,
            'data' => [
                'id' => $payment->payment_id,
                'status' => 'success',
                'amount' => (float) $payment->amount,
                'currency' => ['code' => $payment->currency],
                'metadata' => ['reference' => $payment->reference],
                'method' => ['name' => 'Orange Money'],
                'gateway' => ['name' => 'Test Gateway'],
            ],
        ], $overrides);
    }

    private function postWebhook(string $body, ?string $signature = null)
    {
        return $this->call('POST', '/moneroo/webhook', [], [], [], [
            'HTTP_X_MONEROO_SIGNATURE' => $signature ?? hash_hmac('sha256', $body, self::SECRET),
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], $body);
    }

    public function test_initiate_records_payment_and_returns_moneroo_checkout_url(): void
    {
        Http::fake([
            'api.moneroo.io/v1/payments/initialize' => Http::response([
                'success' => true,
                'data' => [
                    'id' => 'pay_new_123',
                    'checkout_url' => 'https://checkout.moneroo.io/pay_new_123',
                ],
            ], 201),
        ]);

        $user = User::factory()->create(['role' => 'super_admin', 'name' => 'Awa Koné']);
        $plan = $this->plan();

        $this->actingAs($user)->postJson("/moneroo/initiate/{$plan->slug}", [
            'billing_cycle' => 'monthly',
            'first_name' => 'Awa',
            'last_name' => 'Koné',
            'phone' => '+2250700000000',
            'country' => 'CI',
        ])->assertOk()->assertJson([
            'success' => true,
            'redirectUrl' => 'https://checkout.moneroo.io/pay_new_123',
        ]);

        $payment = MonerooPayment::first();
        $this->assertSame('pay_new_123', $payment->payment_id);
        $this->assertSame($user->id, $payment->user_id);
        $this->assertEquals(15000, (float) $payment->amount);

        Http::assertSent(function ($request) use ($payment, $user) {
            return $request->url() === 'https://api.moneroo.io/v1/payments/initialize'
                && $request['amount'] === 15000
                && $request['currency'] === 'XOF'
                && $request['customer']['email'] === $user->email
                && $request['metadata']['reference'] === $payment->reference
                && str_contains($request['return_url'], '/moneroo/return?ref=');
        });
    }

    public function test_unconfigured_moneroo_cannot_accept_a_payment(): void
    {
        config(['services.moneroo.webhook_secret' => '']);

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $this->actingAs($user)->postJson("/moneroo/initiate/{$plan->slug}", [
            'billing_cycle' => 'monthly',
            'first_name' => 'Awa',
            'last_name' => 'Koné',
        ])->assertStatus(422);

        $this->assertSame(0, MonerooPayment::count());
    }

    public function test_disabled_mobile_money_cannot_accept_a_payment(): void
    {
        config(['services.moneroo.enabled' => false]);

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $this->actingAs($user)->postJson("/moneroo/initiate/{$plan->slug}", [
            'billing_cycle' => 'monthly',
            'first_name' => 'Awa',
            'last_name' => 'Koné',
        ])->assertStatus(503)->assertJson([
            'success' => false,
            'message' => 'Le paiement par Mobile Money sera bientôt actif.',
        ]);

        $this->assertSame(0, MonerooPayment::count());
        Http::assertNothingSent();
    }

    public function test_staff_user_cannot_pay_for_the_account(): void
    {
        $user = User::factory()->create(['role' => 'staff']);
        $plan = $this->plan();

        $this->actingAs($user)->postJson("/moneroo/initiate/{$plan->slug}", [
            'billing_cycle' => 'monthly',
            'first_name' => 'Jean',
            'last_name' => 'Test',
        ])->assertForbidden();
    }

    public function test_valid_signed_webhook_verifies_and_activates_subscription_once(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($user, $plan);

        Http::fake([
            'api.moneroo.io/v1/payments/pay_test_123/verify' => Http::response($this->verification($payment)),
        ]);

        $body = json_encode([
            'event' => 'payment.success',
            'data' => ['id' => $payment->payment_id],
        ], JSON_THROW_ON_ERROR);

        $this->postWebhook($body)->assertOk();
        $this->postWebhook($body)->assertOk();

        $this->assertSame(1, Subscription::count());
        $subscription = Subscription::first();
        $this->assertSame('active', $subscription->status);
        $this->assertSame('moneroo', $subscription->metadata['payment_method']);
        $this->assertSame(1, $subscription->invoices()->count());
        $this->assertSame('paid', $subscription->invoices()->first()->status);
        $this->assertTrue($payment->fresh()->subscription_activated);
    }

    public function test_forged_webhook_signature_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($user, $plan);
        $body = json_encode(['event' => 'payment.success', 'data' => ['id' => $payment->payment_id]], JSON_THROW_ON_ERROR);

        $this->postWebhook($body, str_repeat('0', 64))->assertForbidden();

        $this->assertSame(0, Subscription::count());
        Http::assertNothingSent();
    }

    public function test_webhook_does_not_trust_its_success_payload_without_api_confirmation(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($user, $plan);

        Http::fake([
            'api.moneroo.io/v1/payments/pay_test_123/verify' => Http::response(
                $this->verification($payment, ['data' => ['status' => 'pending']])
            ),
        ]);

        $body = json_encode(['event' => 'payment.success', 'data' => ['id' => $payment->payment_id]], JSON_THROW_ON_ERROR);

        $this->postWebhook($body)->assertOk();

        $this->assertSame(0, Subscription::count());
        $this->assertSame('pending', $payment->fresh()->status);
    }

    public function test_underpayment_never_activates_the_plan(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($user, $plan);

        Http::fake([
            'api.moneroo.io/v1/payments/pay_test_123/verify' => Http::response(
                $this->verification($payment, ['data' => ['amount' => 500]])
            ),
        ]);

        $body = json_encode(['event' => 'payment.success', 'data' => ['id' => $payment->payment_id]], JSON_THROW_ON_ERROR);
        $this->postWebhook($body)->assertOk();

        $this->assertSame(0, Subscription::count());
        $this->assertSame('verification_failed', $payment->fresh()->status);
        $this->assertNull($payment->fresh()->verified_at);
    }

    public function test_wrong_currency_or_reference_never_activates_the_plan(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($user, $plan);

        Http::fake([
            'api.moneroo.io/v1/payments/pay_test_123/verify' => Http::response(
                $this->verification($payment, ['data' => [
                    'currency' => ['code' => 'USD'],
                    'metadata' => ['reference' => 'ANOTHER-REFERENCE'],
                ]])
            ),
        ]);

        $body = json_encode(['event' => 'payment.success', 'data' => ['id' => $payment->payment_id]], JSON_THROW_ON_ERROR);
        $this->postWebhook($body)->assertOk();

        $this->assertSame(0, Subscription::count());
        $this->assertSame('verification_failed', $payment->fresh()->status);
    }

    public function test_temporary_verification_failure_requests_a_webhook_retry(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($user, $plan);

        Http::fake([
            'api.moneroo.io/v1/payments/pay_test_123/verify' => Http::response(['message' => 'Unavailable'], 503),
        ]);

        $body = json_encode(['event' => 'payment.success', 'data' => ['id' => $payment->payment_id]], JSON_THROW_ON_ERROR);
        $this->postWebhook($body)->assertStatus(503);

        $this->assertSame(0, Subscription::count());
    }

    public function test_return_page_is_scoped_to_the_authenticated_owner(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $other = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($owner, $plan);

        $this->actingAs($other)
            ->get('/moneroo/return?ref='.$payment->reference.'&paymentId='.$payment->payment_id)
            ->assertRedirect('/plans')
            ->assertSessionHas('error');

        Http::assertNothingSent();
    }

    public function test_authenticated_return_verifies_before_activating(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($user, $plan);

        Http::fake([
            'api.moneroo.io/v1/payments/pay_test_123/verify' => Http::response($this->verification($payment)),
        ]);

        $this->actingAs($user)
            ->get('/moneroo/return?ref='.$payment->reference.'&paymentId='.$payment->payment_id)
            ->assertRedirect('/'.$user->accountCode().'/dashboard')
            ->assertSessionHas('success');

        $this->assertSame(1, Subscription::count());
        $this->assertTrue($payment->fresh()->subscription_activated);
    }

    public function test_return_with_an_inconsistent_payment_id_is_rejected_without_api_call(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $payment = $this->payment($user, $plan);

        $this->actingAs($user)
            ->get('/moneroo/return?ref='.$payment->reference.'&paymentId=pay_forged')
            ->assertRedirect('/plans')
            ->assertSessionHas('error');

        $this->assertSame(0, Subscription::count());
        Http::assertNothingSent();
    }

    public function test_checkout_exposes_moneroo_when_both_secrets_are_configured(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $this->actingAs($user)
            ->get("/plans/{$plan->slug}/checkout")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payment/Checkout')
                ->where('monerooEnabled', true)
                ->where('monerooSetup', [])
            );
    }

    public function test_checkout_keeps_mobile_money_disabled_when_launch_flag_is_off(): void
    {
        config(['services.moneroo.enabled' => false]);

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $this->actingAs($user)
            ->get("/plans/{$plan->slug}/checkout")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Payment/Checkout')
                ->where('monerooEnabled', false)
            );
    }
}
