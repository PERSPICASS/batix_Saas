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

        // ShopFactory octroie un abonnement actif au propriétaire, comme le fait la
        // création de la première boutique en production. Ces tests-ci décrivent
        // justement l'état d'expiration : on repart d'une table vierge.
        Subscription::query()->delete();

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

    /**
     * L'interface doit connaître l'état : sans cette prop, elle continuait d'afficher
     * des boutons de création menant à un envoi refusé. Partagée à tous les rôles,
     * puisqu'un employé subit la restriction de son compte.
     */
    public function test_the_page_is_told_the_account_is_read_only(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDays(20));
        $employee = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);

        foreach ([$owner, $employee] as $user) {
            $this->actingAs($user)
                ->withSession(['active_shop_id' => $shop->id])
                ->get("/{$owner->accountCode()}/dashboard")
                ->assertInertia(fn ($page) => $page->where('readOnlyAccount', true));
        }
    }

    public function test_a_healthy_account_is_not_flagged_read_only(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->addYear(), 'active');

        $this->actingAs($owner)
            ->withSession(['active_shop_id' => $shop->id])
            ->get("/{$owner->accountCode()}/dashboard")
            ->assertInertia(fn ($page) => $page->where('readOnlyAccount', false));
    }

    /**
     * La grâce couvre le renouvellement d'un abonnement PAYANT, dont le paiement peut
     * être en cours de traitement le jour de l'échéance.
     */
    public function test_a_paid_account_inside_the_grace_period_still_writes(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDays(5), 'active');

        $this->attemptWrite($owner, $shop)
            ->assertSessionMissing('error');

        $this->assertSame(1, Product::count());
    }

    /**
     * Un essai, lui, s'arrête à sa date : rien n'est en cours de paiement derrière, et
     * prolonger un essai de 14 jours revenait à en offrir 28.
     */
    public function test_a_trial_gets_no_grace_period_at_all(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDay(), 'trial');

        $this->attemptWrite($owner, $shop)
            ->assertSessionHas('error', fn ($m) => str_contains($m, self::READ_ONLY));

        $this->assertSame(0, Product::count());
        $this->assertNull($owner->fresh()->subscriptionGracePeriodEndsAt());
    }

    public function test_a_trial_still_running_writes_normally(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->addDays(3), 'trial');

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
     * Aucun abonnement du tout vaut abonnement terminé. Ce cas existe en production :
     * une inscription faite alors qu'aucun plan « free » n'était en base repart sans le
     * moindre essai (Onboarding\SignupTrialTest), et c'est par ce trou qu'un compte de
     * démo a continué de travailler des semaines après son expiration.
     *
     * L'inscription n'en souffre pas : /create-shop, qui octroie l'essai, vit hors du
     * groupe {code_user} et n'est donc jamais concerné par ce middleware.
     */
    public function test_an_account_without_any_subscription_is_read_only(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop  = Shop::factory()->create(['user_id' => $owner->id]);
        Subscription::query()->delete();

        $this->attemptWrite($owner, $shop)
            ->assertSessionHas('error', fn ($m) => str_contains($m, self::READ_ONLY));

        $this->assertSame(0, Product::count());
    }

    public function test_signing_up_is_never_blocked_by_the_read_only_rule(): void
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => null]);
        Subscription::query()->delete();

        // La création de la première boutique doit rester possible sans aucun plan.
        $this->actingAs($user)
            ->post('/create-shop', ['name' => 'Quincaillerie Naissante'])
            ->assertSessionMissing('error');

        $this->assertSame(1, Shop::where('user_id', $user->id)->count());
    }

    /**
     * Les imports sont des écritures en masse : ils passent par le même garde-fou que le
     * reste, sans avoir à être recensés un à un. Le bouton est masqué côté interface,
     * mais c'est bien le serveur qui refuse.
     */
    public function test_bulk_imports_are_blocked_too(): void
    {
        [$owner, $shop] = $this->accountExpiring(now()->subDays(20));

        $path = tempnam(sys_get_temp_dir(), 'imp') . '-stock.csv';
        file_put_contents($path, "nom;quantite\nCiment;10\n");

        $this->actingAs($owner)
            ->withSession(['active_shop_id' => $shop->id])
            ->from("/{$owner->accountCode()}/produits")
            ->post("/{$owner->accountCode()}/produits-import", [
                'file' => new \Illuminate\Http\UploadedFile($path, 'stock.csv', null, null, true),
            ])
            ->assertSessionHas('error', fn ($m) => str_contains($m, self::READ_ONLY));

        $this->assertSame(0, Product::count());
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
