<?php

namespace Tests\Feature\PlatformAdmin;

use App\Models\FixedCost;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\PlatformMetrics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Les chiffres de l'admin plateforme étaient faux : annuel compté comme
 * mensuel, essais gratuits dans le revenu, charges en EUR soustraites d'un
 * revenu en FCFA, groupBy('plan_id') sur une colonne inexistante, et un
 * historique filtré sur le statut d'AUJOURD'HUI (un client perdu disparaissait
 * de tous les mois passés).
 */
class PlatformMetricsTest extends TestCase
{
    use RefreshDatabase;

    private PlatformMetrics $metrics;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-15 12:00:00');
        $this->metrics = new PlatformMetrics();
    }

    private function sub(array $attrs, ?SubscriptionPlan $plan = null): Subscription
    {
        return Subscription::create(array_merge([
            'user_id' => User::factory()->create(['role' => 'super_admin'])->id,
            'subscription_plan_id' => ($plan ?? SubscriptionPlan::factory()->create())->id,
            'status' => 'active',
            'amount' => 10000,
            'billing_cycle' => 'monthly',
            'started_at' => now()->subMonths(3),
            'expires_at' => now()->addMonth(),
        ], $attrs));
    }

    public function test_a_yearly_subscription_counts_for_a_twelfth(): void
    {
        $this->sub(['amount' => 120000, 'billing_cycle' => 'yearly', 'expires_at' => now()->addYear()]);

        $this->assertEqualsWithDelta(10000, $this->metrics->mrrAt(now()), 0.01);
    }

    public function test_free_trials_and_pending_requests_are_not_revenue(): void
    {
        $this->sub(['status' => 'trial', 'amount' => 0]);
        $this->sub(['status' => 'pending', 'started_at' => null, 'expires_at' => null]);
        $this->sub([]);

        $this->assertEqualsWithDelta(10000, $this->metrics->mrrAt(now()), 0.01);
    }

    public function test_a_lost_customer_still_counts_in_the_months_it_paid(): void
    {
        // Payé de juillet au 3 octobre, puis expiré.
        $this->sub([
            'status' => 'expired',
            'started_at' => '2026-07-01',
            'expires_at' => '2026-10-03 00:00:00',
        ]);

        $this->assertEqualsWithDelta(10000, $this->metrics->mrrAt(Carbon::parse('2026-09-30 23:00')), 0.01);
        $this->assertEqualsWithDelta(0, $this->metrics->mrrAt(now()), 0.01);

        $october = $this->metrics->movements(Carbon::parse('2026-10-01'), now());
        $this->assertSame(1, $october['churned_count']);
        $this->assertEqualsWithDelta(10000, $october['churned_mrr'], 0.01);
    }

    public function test_an_upgrade_is_expansion_not_churn(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $this->sub(['user_id' => $user->id, 'status' => 'cancelled', 'cancelled_at' => '2026-10-05']);
        $this->sub(['user_id' => $user->id, 'amount' => 25000, 'started_at' => '2026-10-05']);

        $m = $this->metrics->movements(Carbon::parse('2026-10-01'), now());

        $this->assertSame(0, $m['churned_count']);
        $this->assertEqualsWithDelta(15000, $m['expansion_mrr'], 0.01);
        $this->assertEqualsWithDelta(0, $m['new_mrr'], 0.01);
    }

    public function test_fixed_costs_are_converted_to_fcfa_and_annual_ones_spread(): void
    {
        FixedCost::create(['name' => 'VPS', 'category' => 'infra', 'amount_monthly' => 10, 'currency' => 'EUR', 'billing_cycle' => 'monthly', 'is_active' => true]);
        FixedCost::create(['name' => 'Domaine', 'category' => 'infra', 'amount_monthly' => 12000, 'currency' => 'FCFA', 'billing_cycle' => 'annual', 'is_active' => true]);
        FixedCost::create(['name' => 'Arrêté', 'category' => 'infra', 'amount_monthly' => 99999, 'currency' => 'FCFA', 'billing_cycle' => 'monthly', 'is_active' => false]);

        $this->assertEqualsWithDelta(6559.57 + 1000, $this->metrics->monthlyFixedCosts(), 0.01);
    }

    public function test_the_dashboard_splits_revenue_by_plan(): void
    {
        $basic = SubscriptionPlan::factory()->create(['name' => 'Basic']);
        $pro = SubscriptionPlan::factory()->create(['name' => 'Pro']);
        $this->sub([], $basic);
        $this->sub(['amount' => 120000, 'billing_cycle' => 'yearly', 'expires_at' => now()->addYear()], $pro);
        $this->sub(['status' => 'trial', 'amount' => 0], $pro);

        $admin = User::factory()->create(['role' => 'admin_platforme']);

        $this->actingAs($admin)->get(route('platform.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.monthly_revenue', 20000)
                ->has('charts.subscriptions_by_plan', 2)
            );
    }

    public function test_the_mrr_page_renders_with_history(): void
    {
        $this->sub([]);
        $admin = User::factory()->create(['role' => 'admin_platforme']);

        $this->actingAs($admin)->get(route('platform.mrr'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('kpis.mrr', 10000)
                ->has('mrr_history', 12)
                ->where('mrr_history.11.mrr', 10000)
            );
    }
}
