<?php

namespace Tests\Feature\Subscription;

use App\Models\Product;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Un essai terminé ne coupait que quatre créations (boutique, utilisateur, produit,
 * dépôt) ; tout le reste du SaaS restait utilisable indéfiniment. Le compte doit
 * désormais passer en lecture seule une fois la période de grâce de 14 jours écoulée.
 */
class ReadOnlyWhenExpiredTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop} */
    private function accountExpiring(?\Carbon\Carbon $expiresAt, string $status = 'trial'): array
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop  = Shop::factory()->create(['user_id' => $owner->id]);
        $plan  = SubscriptionPlan::factory()->create(['max_products' => 100, 'price' => 0]);

        Subscription::create([
            'user_id'              => $owner->id,
            'subscription_plan_id' => $plan->id,
            'status'               => $status,
            'started_at'           => now()->subMonth(),
            'expires_at'           => $expiresAt,
            'trial_ends_at'        => $expiresAt,
            'amount'               => 0,
        ]);

        return [$owner, $shop];
    }

    private function attemptWrite(User $user, Shop $shop)
    {
        return $this->actingAs($user)
            ->withSession(['active_shop_id' => $shop->id])
            ->from("/{$user->accountCode()}/produits")
            ->post("/{$user->accountCode()}/produits", [
                'name'          => 'Produit test',
                'selling_price'  => 1000,
                'purchase_price' => 500,
                'shop_id'        => $shop->id,
            ]);
    }

    private const READ_ONLY = 'lecture seule';

    public function test_an_account_past_the_grace_period_cannot_write(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDays(20));

        $this->attemptWrite($owner, $shop)
            ->assertSessionHas('error', fn ($m) => str_contains($m, self::READ_ONLY));

        $this->assertSame(0, Product::count());
    }

    public function test_an_account_past_the_grace_period_can_still_read(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDays(20));

        $this->actingAs($owner)
            ->withSession(['active_shop_id' => $shop->id])
            ->get("/{$owner->accountCode()}/produits")
            ->assertOk();
    }

    /** La grâce de 14 jours reste entière : un compte échu d'hier travaille normalement. */
    public function test_an_account_inside_the_grace_period_still_writes(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDays(5));

        $this->attemptWrite($owner, $shop)
            ->assertSessionMissing('error');

        $this->assertSame(1, Product::count());
    }

    public function test_an_active_account_writes(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->addYear(), 'active');

        $this->attemptWrite($owner, $shop);

        $this->assertSame(1, Product::count());
    }

    /**
     * L'abonnement vit sur le compte du propriétaire : un employé ne doit pas continuer
     * à écrire pendant que le compte auquel il appartient est expiré.
     */
    public function test_an_employee_of_an_expired_account_cannot_write_either(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDays(20));
        $employee = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);

        $this->actingAs($employee)
            ->withSession(['active_shop_id' => $shop->id])
            ->from("/{$owner->accountCode()}/produits")
            ->post("/{$owner->accountCode()}/produits", [
                'name'          => 'Produit employé',
                'selling_price'  => 1000,
                'purchase_price' => 500,
                'shop_id'        => $shop->id,
            ])
            ->assertSessionHas('error', fn ($m) => str_contains($m, self::READ_ONLY));

        $this->assertSame(0, Product::count());
    }

    /**
     * Un compte sans le moindre abonnement n'est pas un compte expiré : c'est un compte
     * qui n'a pas fini de s'inscrire (le plan gratuit n'est créé qu'à la première
     * boutique, et pas du tout si aucun plan « free » n'existe en base — cf.
     * Onboarding\SignupTrialTest). Le passer en lecture seule l'enfermerait dehors.
     */
    public function test_an_account_that_never_had_a_subscription_is_not_locked_out(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop  = Shop::factory()->create(['user_id' => $owner->id]);

        // Le quota refuse quand même la création (aucun plan, donc aucun droit), mais ce
        // doit être pour cette raison-là, pas parce que le compte serait « expiré ».
        $this->attemptWrite($owner, $shop)
            ->assertSessionHas('error', fn ($m) => !str_contains($m, self::READ_ONLY));
    }

    /** Sans ces exceptions, un compte expiré serait enfermé : ni langue, ni fermeture de compte. */
    public function test_account_administration_stays_open_when_expired(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDays(20));

        $this->actingAs($owner)
            ->withSession(['active_shop_id' => $shop->id])
            ->from("/{$owner->accountCode()}/dashboard")
            ->post("/{$owner->accountCode()}/locale", ['locale' => 'en'])
            ->assertSessionMissing('error');
    }
}
