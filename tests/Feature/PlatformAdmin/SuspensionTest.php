<?php

namespace Tests\Feature\PlatformAdmin;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * « Suspendre » un compte ou une boutique depuis l'admin plateforme ne faisait
 * rien : is_active était enregistré mais lu nulle part — ni à la connexion, ni
 * sur une session déjà ouverte. Le compte suspendu continuait de travailler.
 */
class SuspensionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop, 2: User} owner, shop, cashier */
    private function account(): array
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $owner->id]);
        $owner->update(['shop_id' => $shop->id]);
        $cashier = User::factory()->create(['role' => 'cashier', 'shop_id' => $shop->id]);

        return [$owner, $shop, $cashier];
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin_platforme']);
    }

    public function test_the_admin_toggle_suspends_the_owner_account(): void
    {
        [$owner] = $this->account();

        $this->actingAs($this->admin())
            ->post(route('platform.accounts.toggle', $owner))
            ->assertSessionHas('success');

        $this->assertFalse($owner->fresh()->is_active);
    }

    public function test_a_suspended_owner_cannot_log_in(): void
    {
        [$owner] = $this->account();
        $owner->update(['is_active' => false]);

        $this->post('/login', ['email' => $owner->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_the_staff_of_a_suspended_owner_cannot_log_in(): void
    {
        [$owner, , $cashier] = $this->account();
        $owner->update(['is_active' => false]);

        $this->post('/login', ['email' => $cashier->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_an_open_session_is_cut_on_the_next_request(): void
    {
        [$owner, , $cashier] = $this->account();

        $url = '/'.$owner->accountCode().'/profile';
        $before = $this->actingAs($cashier)->get($url);
        $this->assertNotSame(route('login'), $before->headers->get('Location'));
        $this->assertAuthenticatedAs($cashier);

        $owner->update(['is_active' => false]);

        // Each real request reloads the user; the test reuses one in-memory model.
        $this->actingAs($cashier->fresh())->get($url)->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_an_active_account_is_untouched(): void
    {
        [$owner, , $cashier] = $this->account();

        $this->post('/login', ['email' => $cashier->email, 'password' => 'password']);

        $this->assertAuthenticatedAs($cashier);
    }

    public function test_a_suspended_shop_is_no_longer_accessible_to_its_owner(): void
    {
        [$owner, $shop] = $this->account();
        $other = Shop::factory()->create(['user_id' => $owner->id]);

        $shop->update(['is_active' => false]);

        $this->assertSame([$other->id], $owner->fresh()->accessibleShopsQuery()->pluck('id')->all());
        $this->assertFalse($owner->fresh()->isSuspended(), 'Il lui reste une boutique active.');
    }

    public function test_staff_of_a_suspended_shop_are_blocked(): void
    {
        [, $shop, $cashier] = $this->account();
        $shop->update(['is_active' => false]);

        $this->assertTrue($cashier->fresh()->isSuspended());
    }

    public function test_an_owner_whose_every_shop_is_suspended_is_blocked(): void
    {
        [$owner, $shop] = $this->account();
        $shop->update(['is_active' => false]);

        $this->assertTrue($owner->fresh()->isSuspended());
    }

    public function test_api_tokens_of_a_suspended_account_are_refused(): void
    {
        [$owner] = $this->account();
        $token = $owner->createToken('test', ['products:read'])->plainTextToken;
        $owner->update(['is_active' => false]);

        $this->withToken($token)->getJson('/api/v1/products')->assertForbidden();
    }

    public function test_the_platform_admin_is_never_suspended(): void
    {
        $admin = $this->admin();
        $admin->update(['is_active' => false]);

        $this->assertFalse($admin->fresh()->isSuspended());
    }
}
