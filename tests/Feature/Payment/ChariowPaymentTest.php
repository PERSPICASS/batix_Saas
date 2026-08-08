<?php

namespace Tests\Feature\Payment;

use App\Models\ChariowCheckout;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class ChariowPaymentTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'whsec_test_secret';

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config([
            'services.chariow.api_key'        => 'sk_test_key',
            'services.chariow.webhook_secret' => self::SECRET,
        ]);
    }

    private function plan(array $attributes = []): SubscriptionPlan
    {
        return SubscriptionPlan::factory()->create(array_merge([
            'price'                     => 15000,
            'chariow_product_id'        => 'prd_monthly',
            'chariow_product_id_yearly' => 'prd_yearly',
        ], $attributes));
    }

    private function checkout(User $user, SubscriptionPlan $plan, array $attributes = []): ChariowCheckout
    {
        return ChariowCheckout::create(array_merge([
            'reference'            => 'BTX-TEST-REF',
            'user_id'              => $user->id,
            'subscription_plan_id' => $plan->id,
            'billing_cycle'        => 'monthly',
            'status'               => 'pending',
            'sale_id'              => 'sal_123',
            'chariow_product_id'   => 'prd_monthly',
            'amount'               => 15000,
            'currency'             => 'XOF',
        ], $attributes));
    }

    private function salePayload(
        string $reference,
        float $amount = 15000,
        string $currency = 'XOF',
        ?float $listed = null
    ): string {
        return json_encode([
            'event' => 'successful.sale',
            'sale'  => [
                'id'              => 'sal_123',
                'status'          => 'completed',
                'amount'          => ['value' => $amount, 'currency' => $currency],
                'original_amount' => ['value' => $listed ?? $amount, 'currency' => $currency],
                'custom_metadata' => ['ref' => $reference],
            ],
        ], JSON_THROW_ON_ERROR);
    }

    private function postPulse(string $body, ?string $signature = null, string $deliveryId = 'dlv_1')
    {
        return $this->call('POST', '/chariow/webhook', [], [], [], [
            'HTTP_X_CHARIOW_SIGNATURE' => $signature ?? 'sha256=' . hash_hmac('sha256', $body, self::SECRET),
            'HTTP_X_PULSE_DELIVERY_ID' => $deliveryId,
            'HTTP_X_PULSE_EVENT'       => 'successful.sale',
            'CONTENT_TYPE'             => 'application/json',
            'HTTP_ACCEPT'              => 'application/json',
        ], $body);
    }

    public function test_a_valid_pulse_activates_the_subscription_and_issues_a_paid_invoice(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $this->checkout($user, $plan);

        $this->postPulse($this->salePayload('BTX-TEST-REF'))->assertOk();

        $subscription = Subscription::where('user_id', $user->id)->first();
        $this->assertNotNull($subscription);
        $this->assertSame('active', $subscription->status);
        $this->assertSame('chariow', $subscription->metadata['payment_method']);
        $this->assertTrue($subscription->expires_at->isFuture());

        $invoice = $subscription->invoices()->first();
        $this->assertNotNull($invoice);
        $this->assertSame('paid', $invoice->status);
        $this->assertEquals(15000, (float) $invoice->total);

        $this->assertTrue(ChariowCheckout::first()->subscription_activated);
    }

    public function test_a_forged_signature_is_rejected_and_grants_nothing(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $this->checkout($user, $plan);

        $this->postPulse($this->salePayload('BTX-TEST-REF'), 'sha256=' . str_repeat('0', 64))
            ->assertStatus(401);

        $this->assertSame(0, Subscription::count());
        $this->assertFalse(ChariowCheckout::first()->subscription_activated);
    }

    public function test_a_missing_signature_is_rejected(): void
    {
        $this->call('POST', '/chariow/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT'  => 'application/json',
        ], $this->salePayload('BTX-TEST-REF'))->assertStatus(401);
    }

    public function test_a_replayed_delivery_never_creates_a_second_subscription(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $this->checkout($user, $plan);

        $body = $this->salePayload('BTX-TEST-REF');

        $this->postPulse($body, deliveryId: 'dlv_same')->assertOk();
        $this->postPulse($body, deliveryId: 'dlv_same')->assertOk();

        $this->assertSame(1, Subscription::count());
        $this->assertSame(1, Subscription::first()->invoices()->count());
    }

    /**
     * Même sans l'en-tête de déduplication, le verrou de `activateSubscription` doit
     * tenir : c'est lui qui garantit un seul abonnement par paiement, la
     * déduplication n'étant qu'une économie d'appels.
     */
    public function test_two_distinct_deliveries_for_the_same_sale_still_activate_only_once(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $this->checkout($user, $plan);

        $body = $this->salePayload('BTX-TEST-REF');

        $this->postPulse($body, deliveryId: 'dlv_a')->assertOk();
        $this->postPulse($body, deliveryId: 'dlv_b')->assertOk();

        $this->assertSame(1, Subscription::count());
    }

    public function test_an_underpaid_sale_in_the_same_currency_does_not_unlock_the_plan(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $this->checkout($user, $plan);

        // Produit Chariow mal tarifé : affiché ET encaissé à 500 pour un plan à 15 000.
        // Pas de remise en jeu, donc c'est bien une erreur de configuration.
        $this->postPulse($this->salePayload('BTX-TEST-REF', 500))->assertOk();

        $this->assertSame(0, Subscription::count());

        $checkout = ChariowCheckout::first();
        $this->assertFalse($checkout->subscription_activated);
        $this->assertSame('completed', $checkout->status);
    }

    /**
     * Le garde-fou porte sur le prix catalogue, pas sur l'encaissé : une remise
     * légitime doit activer normalement. Sans ça, tout client muni d'un code promo
     * paierait sans jamais recevoir son abonnement — et la seule façon de tester la
     * chaîne complète sans argent réel (un code à 100 %) serait bloquée.
     */
    public function test_a_discounted_sale_still_activates_the_subscription(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();
        $this->checkout($user, $plan);

        // Encaissé 0, prix catalogue 15 000 : code promo à 100 %.
        $this->postPulse($this->salePayload('BTX-TEST-REF', 0, 'XOF', 15000))->assertOk();

        $this->assertSame(1, Subscription::count());
        $this->assertSame('active', Subscription::first()->status);
        $this->assertTrue(ChariowCheckout::first()->subscription_activated);
    }

    public function test_a_sale_made_outside_the_app_is_acknowledged_without_side_effects(): void
    {
        $body = json_encode([
            'event' => 'successful.sale',
            'sale'  => [
                'id'              => 'sal_direct',
                'status'          => 'completed',
                'amount'          => ['value' => 5000, 'currency' => 'XOF'],
                'custom_metadata' => null,
            ],
        ], JSON_THROW_ON_ERROR);

        $this->postPulse($body)->assertOk();

        $this->assertSame(0, Subscription::count());
    }

    public function test_initiate_records_the_checkout_and_returns_the_payment_url(): void
    {
        Http::fake([
            'api.chariow.com/*' => Http::response([
                'data' => [
                    'step'     => 'payment',
                    'purchase' => ['id' => 'sal_new'],
                    'payment'  => [
                        'checkout_url'   => 'https://pay.chariow.com/abc',
                        'transaction_id' => 'txn_new',
                    ],
                ],
            ]),
        ]);

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $response = $this->actingAs($user)->postJson("/chariow/initiate/{$plan->slug}", [
            'billing_cycle'      => 'yearly',
            'first_name'         => 'Awa',
            'last_name'          => 'Diallo',
            'phone_number'       => '0700000000',
            'phone_country_code' => 'CI',
        ]);

        $response->assertOk()->assertJson([
            'success'     => true,
            'redirectUrl' => 'https://pay.chariow.com/abc',
        ]);

        $checkout = ChariowCheckout::first();
        $this->assertSame('prd_yearly', $checkout->chariow_product_id);
        $this->assertSame('sal_new', $checkout->sale_id);
        // Annuel = 10 mois payés, pas 12.
        $this->assertEquals(150000, (float) $checkout->amount);

        Http::assertSent(function ($request) use ($checkout) {
            return $request['product_id'] === 'prd_yearly'
                && $request['phone']['country_code'] === 'CI'
                && $request['custom_metadata']['ref'] === $checkout->reference;
        });
    }

    /**
     * Chariow rejette la demande entière (« The redirect url field must be a valid
     * URL ») dès que l'hôte n'est pas public. En local on omet le champ plutôt que
     * d'envoyer une valeur refusée — sinon aucun paiement n'est testable en dev.
     */
    public function test_a_non_public_return_url_is_omitted_rather_than_sent(): void
    {
        URL::forceRootUrl('http://127.0.0.1:8000');
        $this->fakeCheckout();

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $this->actingAs($user)->postJson("/chariow/initiate/{$plan->slug}", [
            'billing_cycle'      => 'monthly',
            'first_name'         => 'Awa',
            'last_name'          => 'Diallo',
            'phone_number'       => '0700000000',
            'phone_country_code' => 'CI',
        ])->assertOk();

        Http::assertSent(fn ($request) => !isset($request['redirect_url']));
    }

    public function test_a_public_return_url_is_sent(): void
    {
        URL::forceRootUrl('https://app.batixpro.com');
        $this->fakeCheckout();

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $this->actingAs($user)->postJson("/chariow/initiate/{$plan->slug}", [
            'billing_cycle'      => 'monthly',
            'first_name'         => 'Awa',
            'last_name'          => 'Diallo',
            'phone_number'       => '0700000000',
            'phone_country_code' => 'CI',
        ])->assertOk();

        Http::assertSent(fn ($request) => str_contains($request['redirect_url'] ?? '', 'app.batixpro.com/chariow/return'));
    }

    /**
     * Un code promo à 100 % ramène le panier à zéro : Chariow finalise la vente sans
     * page de paiement et ne renvoie aucune URL. Exiger `step: payment` faisait passer
     * ce succès pour un échec — et c'est aussi le seul moyen de tester la chaîne
     * complète sans argent réel, Chariow n'ayant pas de sandbox.
     */
    public function test_a_sale_completed_without_a_payment_page_is_treated_as_a_success(): void
    {
        Http::fake([
            'api.chariow.com/*' => Http::response([
                'data' => [
                    'step'     => 'completed',
                    'purchase' => ['id' => 'sal_free', 'status' => 'completed'],
                ],
            ]),
        ]);

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $response = $this->actingAs($user)->postJson("/chariow/initiate/{$plan->slug}", [
            'billing_cycle'      => 'monthly',
            'first_name'         => 'Awa',
            'last_name'          => 'Diallo',
            'phone_number'       => '0700000000',
            'phone_country_code' => 'CI',
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        $checkout = ChariowCheckout::first();
        $this->assertNotNull($checkout);
        $this->assertSame('sal_free', $checkout->sale_id);
        // Le client repart vers notre page de retour, pas vers une URL Chariow absente.
        $this->assertStringContainsString(
            "/chariow/return?ref={$checkout->reference}",
            $response->json('redirectUrl')
        );
    }

    public function test_an_already_purchased_response_is_still_a_failure(): void
    {
        Http::fake([
            'api.chariow.com/*' => Http::response(['data' => ['step' => 'already_purchased']]),
        ]);

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan();

        $this->actingAs($user)->postJson("/chariow/initiate/{$plan->slug}", [
            'billing_cycle'      => 'monthly',
            'first_name'         => 'Awa',
            'last_name'          => 'Diallo',
            'phone_number'       => '0700000000',
            'phone_country_code' => 'CI',
        ])->assertStatus(422);

        $this->assertSame('failed', ChariowCheckout::first()->status);
    }

    private function fakeCheckout(): void
    {
        Http::fake([
            'api.chariow.com/*' => Http::response([
                'data' => [
                    'step'     => 'payment',
                    'purchase' => ['id' => 'sal_new'],
                    'payment'  => ['checkout_url' => 'https://pay.chariow.com/abc', 'transaction_id' => 'txn_new'],
                ],
            ]),
        ]);
    }

    public function test_initiate_refuses_a_plan_that_has_no_chariow_product(): void
    {
        Http::fake();

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan(['chariow_product_id' => null]);

        $this->actingAs($user)->postJson("/chariow/initiate/{$plan->slug}", [
            'billing_cycle'      => 'monthly',
            'first_name'         => 'Awa',
            'last_name'          => 'Diallo',
            'phone_number'       => '0700000000',
            'phone_country_code' => 'CI',
        ])->assertStatus(422);

        $this->assertSame(0, ChariowCheckout::count());
        Http::assertNothingSent();
    }

    public function test_a_staff_user_cannot_initiate_a_payment_for_the_account(): void
    {
        Http::fake();

        $user = User::factory()->create(['role' => 'user']);
        $plan = $this->plan();

        $this->actingAs($user)->postJson("/chariow/initiate/{$plan->slug}", [
            'billing_cycle'      => 'monthly',
            'first_name'         => 'Awa',
            'last_name'          => 'Diallo',
            'phone_number'       => '0700000000',
            'phone_country_code' => 'CI',
        ])->assertStatus(403);

        Http::assertNothingSent();
    }

    /**
     * Le bouton Mobile Money est toujours rendu, mais le formulaire ne s'ouvre que si
     * `chariowEnabled` est vrai. C'est ce contrat de props que garde ce test : sans
     * lui, un plan non mappé rouvrirait le formulaire et mènerait à un 422.
     */
    public function test_the_checkout_page_reports_chariow_as_not_ready_when_unconfigured(): void
    {
        config(['services.chariow.api_key' => '']);

        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan(['chariow_product_id' => null, 'chariow_product_id_yearly' => null]);

        $this->actingAs($user)
            ->get("/plans/{$plan->slug}/checkout")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('chariowEnabled', false)
                ->where('chariowCycles.monthly', false)
                ->where('chariowCycles.yearly', false));
    }

    public function test_the_checkout_page_reports_chariow_as_ready_once_mapped(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = $this->plan(['chariow_product_id_yearly' => null]);

        $this->actingAs($user)
            ->get("/plans/{$plan->slug}/checkout")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('chariowEnabled', true)
                ->where('chariowCycles.monthly', true)
                ->where('chariowCycles.yearly', false));
    }

    public function test_the_return_page_does_not_expose_another_users_payment(): void
    {
        Http::fake();

        $owner     = User::factory()->create(['role' => 'super_admin']);
        $stranger  = User::factory()->create(['role' => 'super_admin']);
        $plan      = $this->plan();
        $checkout  = $this->checkout($owner, $plan);

        $this->actingAs($stranger)
            ->get("/chariow/return?ref={$checkout->reference}")
            ->assertRedirect('/plans');

        Http::assertNothingSent();
        $this->assertSame(0, Subscription::count());
    }
}
