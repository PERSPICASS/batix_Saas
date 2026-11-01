<?php

namespace Tests\Feature\User;

use App\Models\Shop;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * The role menu offers what the server accepts. It listed six hard-coded roles,
 * « Admin plateforme » included — refused on save, but shown to every account owner.
 */
class AssignableRolesTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    public function test_the_owner_is_offered_every_member_role_but_never_owner_or_platform_admin(): void
    {
        $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/users/create")
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('assignableRoles', ['admin', 'manager', 'stock_manager', 'cashier', 'staff']));
    }

    /** Le formulaire coche d'office les modules du rôle choisi : les mêmes que defaultsForRole(). */
    public function test_the_form_receives_each_roles_default_modules(): void
    {
        $this->actingAs($this->owner)
            ->get("/{$this->owner->code_user}/users/create")
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('roleDefaults.cashier', count(UserPermission::defaultsForRole('cashier')))
                ->where('roleDefaults.cashier.0', ['module' => 'sales'] + UserPermission::defaultsForRole('cashier')['sales'])
                ->has('roleDefaults.manager', count(UserPermission::defaultsForRole('manager')))
                ->missing('roleDefaults.super_admin'));
    }

    public function test_a_manager_is_not_offered_the_admin_roles(): void
    {
        $manager = User::factory()->create(['role' => 'manager', 'shop_id' => $this->shop->id]);
        UserPermission::create([
            'user_id' => $manager->id, 'module' => 'users',
            'can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => false,
        ]);

        // Staff browse under the account owner's code (ValidateAccountAccess).
        $this->actingAs($manager)
            ->get("/{$this->owner->code_user}/users/create")
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('assignableRoles', ['manager', 'stock_manager', 'cashier', 'staff']));
    }

    public function test_platform_admin_is_still_refused_on_save(): void
    {
        $this->actingAs($this->owner)
            ->post("/{$this->owner->code_user}/users", [
                'name' => 'Intrus',
                'email' => 'intrus@example.com',
                'password' => 'secret-password',
                'password_confirmation' => 'secret-password',
                'role' => 'admin_platforme',
                'shop_id' => $this->shop->id,
            ])
            ->assertSessionHasErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'intrus@example.com']);
    }
}
