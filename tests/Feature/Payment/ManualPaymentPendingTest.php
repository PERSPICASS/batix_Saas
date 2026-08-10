<?php

namespace Tests\Feature\Payment;

use App\Mail\SubscriptionInvoiceMail;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ManualPaymentPendingTest extends TestCase
{
    use RefreshDatabase;

    public function test_manual_payment_creates_a_pending_subscription_not_an_active_one(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = SubscriptionPlan::factory()->create(['price' => 29.99]);

        $response = $this->actingAs($user)->post("/plans/{$plan->slug}/process", [
            'payment_method' => 'wave',
            'billing_cycle' => 'monthly',
            'phone' => '0600000000',
            'transaction_ref' => 'REF-123',
        ]);

        $response->assertRedirect();

        $subscription = Subscription::where('user_id', $user->id)->first();
        $this->assertNotNull($subscription);
        $this->assertSame('pending', $subscription->status);
        $this->assertNull($subscription->started_at);

        $invoice = $subscription->invoices()->first();
        $this->assertNotNull($invoice);
        $this->assertSame('pending', $invoice->status);
        $this->assertNull($invoice->paid_at);

        // The core of the fix: submitting a manual payment must never grant access
        // on its own.
        $this->assertNull($user->fresh()->activeSubscription());
    }

    public function test_free_plan_still_activates_instantly_without_review(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = SubscriptionPlan::factory()->create(['price' => 0]);

        $response = $this->actingAs($user)->post("/plans/{$plan->slug}/process", [
            'payment_method' => 'wave',
            'billing_cycle' => 'monthly',
        ]);

        $response->assertRedirect();

        // Ce qui compte ici est l'accès immédiat, sans revue d'un administrateur — par
        // opposition au paiement manuel qui reste « pending ». Le statut retenu est
        // « trial » depuis que le plan gratuit est daté : c'est le même essai que celui
        // de l'inscription, et non plus un abonnement actif sans fin (cf.
        // Subscription\FreePlanActivationTest).
        $subscription = Subscription::where('user_id', $user->id)->first();
        $this->assertSame('trial', $subscription->status);
        $this->assertNotNull($user->fresh()->activeSubscription());
        $this->assertNotNull($subscription->expires_at);
    }

    public function test_platform_admin_activation_flips_pending_subscription_to_active_and_sends_invoice_mail(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin_platforme']);
        $user = User::factory()->create(['role' => 'super_admin']);
        $plan = SubscriptionPlan::factory()->create(['price' => 15, 'name' => 'Growth']);

        $this->actingAs($user)->post("/plans/{$plan->slug}/process", [
            'payment_method' => 'virement',
            'billing_cycle' => 'monthly',
        ]);

        $subscription = Subscription::where('user_id', $user->id)->first();

        $response = $this->actingAs($admin)
            ->post("/platform-admin/active-subscriptions/{$subscription->id}/activate");

        $response->assertRedirect();

        $subscription->refresh();
        $this->assertSame('active', $subscription->status);
        $this->assertNotNull($subscription->started_at);
        $this->assertNotNull($subscription->expires_at);
        $this->assertSame('paid', $subscription->invoices()->first()->status);

        $this->assertNotNull($user->fresh()->activeSubscription());

        Mail::assertSent(SubscriptionInvoiceMail::class);
    }

    public function test_activating_a_new_subscription_cancels_any_other_active_one_for_the_same_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin_platforme']);
        $user = User::factory()->create(['role' => 'super_admin']);
        $oldPlan = SubscriptionPlan::factory()->create();
        $newPlan = SubscriptionPlan::factory()->create(['price' => 20]);

        $oldSubscription = Subscription::create([
            'user_id' => $user->id,
            'subscription_plan_id' => $oldPlan->id,
            'status' => 'active',
            'started_at' => now()->subMonth(),
            'expires_at' => now()->addMonth(),
            'amount' => 10,
            'billing_cycle' => 'monthly',
        ]);

        $this->actingAs($user)->post("/plans/{$newPlan->slug}/process", [
            'payment_method' => 'wave',
            'billing_cycle' => 'monthly',
        ]);

        $newSubscription = Subscription::where('subscription_plan_id', $newPlan->id)->first();

        $this->actingAs($admin)->post("/platform-admin/active-subscriptions/{$newSubscription->id}/activate");

        $this->assertSame('cancelled', $oldSubscription->fresh()->status);
        $this->assertSame('active', $newSubscription->fresh()->status);
    }
}
