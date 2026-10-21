<?php

namespace Tests\Feature\Auth;

use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorEnforcementTest extends TestCase
{
    use RefreshDatabase;

    private function userWith2fa(array $attributes = []): array
    {
        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();

        $user = User::factory()->create(array_merge([
            'two_factor_enabled' => true,
            'google2fa_secret' => $secret,
        ], $attributes));

        return [$user, $secret, $google2fa];
    }

    public function test_platform_admin_route_redirects_to_2fa_challenge_when_not_verified(): void
    {
        [$user] = $this->userWith2fa(['role' => 'admin_platforme']);

        $response = $this->actingAs($user)->get('/platform-admin/dashboard');

        $response->assertRedirect(route('two-factor.verify.get'));
    }

    public function test_platform_admin_route_is_accessible_after_completing_2fa_challenge(): void
    {
        [$user, $secret, $google2fa] = $this->userWith2fa(['role' => 'admin_platforme']);

        $this->actingAs($user)
            ->postJson('/two-factor/check-code', ['code' => $google2fa->getCurrentOtp($secret)])
            ->assertJson(['verified' => true]);

        $response = $this->actingAs($user)->get('/platform-admin/dashboard');

        $response->assertOk();
    }

    public function test_wrong_2fa_code_does_not_grant_access(): void
    {
        [$user] = $this->userWith2fa(['role' => 'admin_platforme']);

        $this->actingAs($user)
            ->postJson('/two-factor/check-code', ['code' => '000000'])
            ->assertStatus(422)
            ->assertJson(['verified' => false]);

        $response = $this->actingAs($user)->get('/platform-admin/dashboard');

        $response->assertRedirect(route('two-factor.verify.get'));
    }

    public function test_payment_checkout_route_also_enforces_2fa(): void
    {
        [$user] = $this->userWith2fa(['role' => 'super_admin']);
        $plan = SubscriptionPlan::factory()->create();

        $response = $this->actingAs($user)->get("/plans/{$plan->slug}/checkout");

        $response->assertRedirect(route('two-factor.verify.get'));
    }
}
