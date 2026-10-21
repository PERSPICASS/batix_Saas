<?php

namespace Tests\Feature\TenantIsolation;

use App\Models\Shop;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossTenantPermissionTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(?Shop $shop = null): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);

        if ($shop) {
            $shop->update(['user_id' => $user->id]);
        }

        // Un compte qui agit a un plan : sans lui, EnforceSubscriptionReadOnly répond
        // avant le contrôleur et ce test d'isolation ne testerait plus rien.
        $this->subscribeAccount($user->id);

        return $user;
    }

    /**
     * Every self-registered account owner holds the `super_admin` role, so the
     * role check in PermissionController is not a tenant boundary on its own.
     */
    public function test_super_admin_cannot_update_another_tenants_user_permissions(): void
    {
        $attacker = $this->superAdmin();

        $shopB = Shop::factory()->create();
        $victimOwner = $this->superAdmin($shopB);
        $victim = User::factory()->create(['role' => 'cashier', 'shop_id' => $shopB->id]);

        UserPermission::create([
            'user_id' => $victim->id,
            'module' => 'products',
            'can_view' => true,
            'can_create' => false,
            'can_edit' => false,
            'can_delete' => false,
        ]);

        $response = $this->actingAs($attacker)
            ->patch("/{$attacker->code_user}/permissions/{$victim->id}", [
                'permissions' => [
                    [
                        'module' => 'products',
                        'can_view' => true,
                        'can_create' => true,
                        'can_edit' => true,
                        'can_delete' => true,
                    ],
                ],
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $victim->id,
            'module' => 'products',
            'can_delete' => false,
        ]);
    }

    public function test_super_admin_cannot_reset_another_tenants_user_permissions(): void
    {
        $attacker = $this->superAdmin();

        $shopB = Shop::factory()->create();
        $this->superAdmin($shopB);
        $victim = User::factory()->create(['role' => 'cashier', 'shop_id' => $shopB->id]);

        UserPermission::create([
            'user_id' => $victim->id,
            'module' => 'sales',
            'can_view' => false,
            'can_create' => false,
            'can_edit' => false,
            'can_delete' => false,
        ]);

        $response = $this->actingAs($attacker)
            ->post("/{$attacker->code_user}/permissions/{$victim->id}/reset");

        $response->assertForbidden();

        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $victim->id,
            'module' => 'sales',
            'can_view' => false,
        ]);
    }

    /**
     * Guards the fix for the missing `$code_user` argument: the route is
     * `{code_user}/permissions/{user}`, so a signature without it made every call 500.
     */
    public function test_super_admin_can_update_permissions_of_a_user_in_their_own_shop(): void
    {
        $shopA = Shop::factory()->create();
        $owner = $this->superAdmin($shopA);
        $employee = User::factory()->create(['role' => 'cashier', 'shop_id' => $shopA->id]);

        $response = $this->actingAs($owner)
            ->patch("/{$owner->code_user}/permissions/{$employee->id}", [
                'permissions' => [
                    [
                        'module' => 'products',
                        'can_view' => true,
                        'can_create' => true,
                        'can_edit' => false,
                        'can_delete' => false,
                    ],
                ],
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $employee->id,
            'module' => 'products',
            'can_create' => true,
            'can_delete' => false,
        ]);
    }

    public function test_super_admin_can_reset_permissions_of_a_user_in_their_own_shop(): void
    {
        $shopA = Shop::factory()->create();
        $owner = $this->superAdmin($shopA);
        $employee = User::factory()->create(['role' => 'cashier', 'shop_id' => $shopA->id]);

        $response = $this->actingAs($owner)
            ->post("/{$owner->code_user}/permissions/{$employee->id}/reset");

        $response->assertRedirect();

        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $employee->id,
            'module' => 'sales',
            'can_view' => true,
        ]);
    }

    /**
     * A manager does not bypass hasPermission(), so self-editing would be a
     * straight privilege escalation.
     */
    public function test_manager_cannot_grant_permissions_to_themselves(): void
    {
        $shopA = Shop::factory()->create();
        $owner = $this->superAdmin($shopA);
        $manager = User::factory()->create(['role' => 'manager', 'shop_id' => $shopA->id]);

        UserPermission::create([
            'user_id' => $manager->id,
            'module' => 'users',
            'can_view' => true,
            'can_create' => false,
            'can_edit' => false,
            'can_delete' => false,
        ]);

        // Un employé agit sous le code du COMPTE (celui du propriétaire), pas le sien.
        $response = $this->actingAs($manager)
            ->patch("/{$owner->code_user}/permissions/{$manager->id}", [
                'permissions' => [
                    [
                        'module' => 'users',
                        'can_view' => true,
                        'can_create' => true,
                        'can_edit' => true,
                        'can_delete' => true,
                    ],
                ],
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $manager->id,
            'module' => 'users',
            'can_delete' => false,
        ]);
    }

    public function test_permissions_index_does_not_list_other_tenants_users(): void
    {
        $attacker = $this->superAdmin();

        $shopB = Shop::factory()->create();
        $this->superAdmin($shopB);
        $victim = User::factory()->create(['role' => 'cashier', 'shop_id' => $shopB->id]);

        $response = $this->actingAs($attacker)
            ->get("/{$attacker->code_user}/permissions");

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page->where(
                'users',
                fn ($users) => collect($users)->pluck('id')->doesntContain($victim->id)
            )
        );
    }
}
