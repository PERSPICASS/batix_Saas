<?php

namespace Tests\Feature\PlatformAdmin;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\PlatformMetrics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountDetailTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin_platforme']);
    }

    /** Le cas d'Aziz Sami : Growth à 35 000, payé 15 000 / mois en tant que partenaire. */
    private function partner(): array
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $owner->id]);
        $owner->update(['shop_id' => $shop->id]);
        Subscription::where('user_id', $owner->id)->delete();

        $growth = SubscriptionPlan::factory()->create(['name' => 'Growth', 'price' => 35000]);
        $sub = Subscription::create([
            'user_id' => $owner->id,
            'subscription_plan_id' => $growth->id,
            'status' => 'active',
            'amount' => 35000,
            'billing_cycle' => 'monthly',
            'started_at' => now()->subDays(10),
            'expires_at' => now()->addDays(20),
        ]);

        return [$owner, $shop, $sub];
    }

    public function test_the_account_page_shows_shops_staff_subscriptions_and_invoices(): void
    {
        [$owner, $shop, $sub] = $this->partner();
        User::factory()->create(['role' => 'cashier', 'shop_id' => $shop->id, 'name' => 'Caissier Test']);

        $this->actingAs($this->admin())
            ->get(route('platform.accounts.show', $owner))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('PlatformAdmin/AccountShow')
                ->where('account.code_user', $owner->code_user)
                ->has('shops', 1)
                ->where('shops.0.id', $shop->id)
                ->has('staff', 1)
                ->where('staff.0.name', 'Caissier Test')
                ->has('subscriptions', 1)
                ->where('subscriptions.0.is_current', true)
                ->where('subscriptions.0.plan_price', 35000)
            );
    }

    public function test_only_account_owners_have_a_detail_page(): void
    {
        [, $shop] = $this->partner();
        $cashier = User::factory()->create(['role' => 'cashier', 'shop_id' => $shop->id]);

        $this->actingAs($this->admin())->get(route('platform.accounts.show', $cashier))->assertNotFound();
    }

    public function test_the_page_is_closed_to_account_owners(): void
    {
        [$owner] = $this->partner();
        $other = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($other)->get(route('platform.accounts.show', $owner))->assertForbidden();
    }

    public function test_a_negotiated_price_is_what_the_figures_count(): void
    {
        [$owner, , $sub] = $this->partner();

        $this->actingAs($this->admin())
            ->post(route('platform.active-subscriptions.amount', $sub), ['amount' => 15000, 'billing_cycle' => 'monthly'])
            ->assertSessionHas('success');

        $this->assertEqualsWithDelta(15000, (new PlatformMetrics())->mrrAt(now()), 0.01);
    }

    public function test_a_manual_renewal_records_the_payment_at_the_negotiated_price(): void
    {
        [$owner, , $sub] = $this->partner();
        $sub->update(['amount' => 15000]);

        $this->actingAs($this->admin())->post(route('platform.active-subscriptions.renew', $sub), [
            'months' => 3,
            'record_payment' => true,
            'payment_method' => 'wave',
        ]);

        $invoice = SubscriptionInvoice::sole();
        $this->assertEqualsWithDelta(45000, (float) $invoice->total, 0.01, '3 mois × 15 000, pas le prix du plan.');
        $this->assertSame('paid', $invoice->status);
        $this->assertSame('wave', $invoice->payment_method);
        $this->assertEqualsWithDelta(15000, (float) $sub->fresh()->amount, 0.01, 'Le renouvellement garde le prix négocié.');
    }

    public function test_a_renewal_without_payment_records_no_invoice(): void
    {
        [, , $sub] = $this->partner();

        $this->actingAs($this->admin())->post(route('platform.active-subscriptions.renew', $sub), ['months' => 1]);

        $this->assertSame(0, SubscriptionInvoice::count());
    }
}
