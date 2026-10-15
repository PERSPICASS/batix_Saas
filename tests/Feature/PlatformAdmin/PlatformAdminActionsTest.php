<?php

namespace Tests\Feature\PlatformAdmin;

use App\Models\Category;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformAdminActionsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin_platforme']);
    }

    private function subscription(array $attrs = []): Subscription
    {
        return Subscription::create(array_merge([
            'user_id' => User::factory()->create(['role' => 'super_admin'])->id,
            'subscription_plan_id' => SubscriptionPlan::factory()->create()->id,
            'status' => 'active',
            'amount' => 10000,
            'billing_cycle' => 'monthly',
            'started_at' => now()->subMonth(),
            'expires_at' => now()->addDays(20),
        ], $attrs));
    }

    public function test_every_platform_route_is_closed_to_an_account_owner(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $plan = SubscriptionPlan::factory()->create();

        foreach ([
            route('platform.dashboard'),
            route('platform.mrr'),
            route('platform.accounts'),
            route('platform.shops'),
            route('platform.subscriptions.index'),
            route('platform.subscriptions.edit', $plan),
            route('platform.active-subscriptions'),
            route('platform.settings'),
        ] as $url) {
            $this->actingAs($owner)->get($url)->assertForbidden();
        }
    }

    /** Le front passait plan.id alors que le plan se lie par slug : toutes les actions donnaient 404. */
    public function test_plans_are_addressed_by_slug(): void
    {
        $plan = SubscriptionPlan::factory()->create(['is_active' => true]);

        $this->actingAs($this->admin())
            ->post(route('platform.subscriptions.toggle', $plan->slug))
            ->assertSessionHas('success');

        $this->assertFalse($plan->fresh()->is_active);
    }

    /** subscriptions.subscription_plan_id est RESTRICT : supprimer un plan déjà souscrit donnait une 500. */
    public function test_a_plan_with_past_subscriptions_cannot_be_deleted(): void
    {
        $sub = $this->subscription(['status' => 'expired']);
        $plan = $sub->plan;

        $this->actingAs($this->admin())
            ->delete(route('platform.subscriptions.destroy', $plan->slug))
            ->assertSessionHas('error');

        $this->assertModelExists($plan);
    }

    public function test_an_unused_plan_can_be_deleted(): void
    {
        $plan = SubscriptionPlan::factory()->create();

        $this->actingAs($this->admin())
            ->delete(route('platform.subscriptions.destroy', $plan->slug))
            ->assertRedirect(route('platform.subscriptions.index'));

        $this->assertModelMissing($plan);
    }

    /** Renouveler à J-20 écrasait les 20 jours restants. */
    public function test_renewing_keeps_the_days_left(): void
    {
        $sub = $this->subscription();
        $before = $sub->expires_at->copy();

        $this->actingAs($this->admin())
            ->post(route('platform.active-subscriptions.renew', $sub), ['months' => 1]);

        $this->assertTrue($sub->fresh()->expires_at->equalTo($before->addMonth()));
    }

    public function test_activating_an_old_pending_request_never_lands_in_the_past(): void
    {
        $sub = $this->subscription([
            'status' => 'pending',
            'started_at' => null,
            'expires_at' => now()->subDays(10),
        ]);

        $this->actingAs($this->admin())
            ->post(route('platform.active-subscriptions.activate', $sub));

        $sub->refresh();
        $this->assertSame('active', $sub->status);
        $this->assertTrue($sub->expires_at->isFuture());
    }

    public function test_changing_dates_does_not_resurrect_a_cancelled_subscription(): void
    {
        $sub = $this->subscription(['status' => 'cancelled', 'cancelled_at' => now()]);

        $this->actingAs($this->admin())
            ->post(route('platform.active-subscriptions.update-dates', $sub), [
                'started_at' => now()->subMonth()->toDateString(),
                'expires_at' => now()->addMonth()->toDateString(),
            ]);

        $this->assertSame('cancelled', $sub->fresh()->status);
    }

    public function test_the_subscriptions_page_survives_a_pending_request(): void
    {
        $this->subscription(['status' => 'pending', 'started_at' => null, 'expires_at' => null]);

        $this->actingAs($this->admin())
            ->get(route('platform.active-subscriptions'))
            ->assertOk();
    }

    /** Le filtre catégories listait celles de toutes les boutiques. */
    public function test_shop_products_only_lists_that_shops_categories(): void
    {
        $shop = Shop::factory()->create();
        $other = Shop::factory()->create();
        // En prod (Postgres) les catégories peuvent être globales (shop_id NULL) ; le
        // harnais SQLite garde la colonne NOT NULL, d'où une catégorie d'une 3e boutique.
        $mine = Category::factory()->create(['shop_id' => Shop::factory()->create()->id]);
        $theirs = Category::factory()->create(['shop_id' => $other->id]);
        \App\Models\Product::factory()->create(['shop_id' => $shop->id, 'category_id' => $mine->id]);
        \App\Models\Product::factory()->create(['shop_id' => $other->id, 'category_id' => $theirs->id]);

        $this->actingAs($this->admin())
            ->get(route('platform.shops.products', $shop))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('categories', 1)
                ->where('categories.0.id', $mine->id)
            );
    }

    public function test_search_is_case_insensitive(): void
    {
        User::factory()->create(['role' => 'super_admin', 'name' => 'Quincaillerie Kouassi']);

        $this->actingAs($this->admin())
            ->get(route('platform.accounts', ['search' => 'kouassi']))
            ->assertInertia(fn ($page) => $page->where('accounts.total', 1));
    }
}
