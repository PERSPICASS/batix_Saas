<?php

namespace Tests\Feature\User;

use App\Models\ActivityLog;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Le formulaire Utilisateurs proposait « Super Admin » : l'invité devenait un NOUVEAU
 * propriétaire, sans boutique ni abonnement, qui atterrissait sur « créez votre boutique ».
 * Le co-gérant du compte est désormais `admin` : toutes les boutiques du propriétaire,
 * sans l'abonnement, les tokens API ni la création/suppression de boutique.
 */
class AccountAdminTest extends TestCase
{
    use RefreshDatabase;

    private Shop $main;
    private Shop $second;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->main = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->main->id]);
        $this->main->update(['user_id' => $this->owner->id]);
        $this->second = Shop::factory()->create(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->main);

        Route::middleware(['web', 'auth'])->get('/__binding-probe/{sale}', fn (Sale $sale) => 'ok:' . $sale->id);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'shop_id' => $this->main->id]);
    }

    private function sale(Shop $shop): Sale
    {
        return Sale::create([
            'shop_id' => $shop->id, 'user_id' => $shop->user_id, 'sale_date' => now(),
            'payment_method' => 'cash', 'status' => 'completed', 'subtotal' => 1000,
            'tax_amount' => 0, 'discount_amount' => 0, 'total' => 1000, 'amount_paid' => 1000,
            'change_amount' => 0, 'remaining_amount' => 0,
        ]);
    }

    private function invite(User $by, array $data)
    {
        return $this->actingAs($by)->post("/{$this->owner->code_user}/users", $data + [
            'name' => 'Invité', 'email' => 'invite@example.com', 'is_active' => true,
        ]);
    }

    public function test_the_owner_can_no_longer_create_another_owner(): void
    {
        $this->invite($this->owner, ['role' => 'super_admin', 'shop_id' => $this->main->id])
            ->assertSessionHasErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'invite@example.com']);
    }

    public function test_an_admin_gets_a_main_shop_without_choosing_one_and_every_module(): void
    {
        // Le formulaire ne demande pas de boutique au co-gérant : il reçoit la première du compte.
        $this->invite($this->owner, ['role' => 'admin'])->assertSessionHasNoErrors();

        $admin = User::where('email', 'invite@example.com')->firstOrFail();
        $this->assertSame($this->main->id, $admin->shop_id);
        $this->assertSame($this->owner->id, $admin->ownerId());
        $this->assertTrue($admin->hasPermission('expenses', 'delete'));
    }

    public function test_other_roles_still_need_a_shop(): void
    {
        $this->invite($this->owner, ['role' => 'cashier'])->assertSessionHasErrors('shop_id');
    }

    public function test_editing_an_admin_keeps_their_main_shop(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'shop_id' => $this->second->id]);

        $this->actingAs($this->owner)->put("/{$this->owner->code_user}/users/{$admin->id}", [
            'name' => 'Renommé', 'email' => $admin->email, 'role' => 'admin', 'is_active' => true,
        ])->assertSessionHasNoErrors();

        $this->assertSame($this->second->id, $admin->fresh()->shop_id);
    }

    public function test_an_admin_reaches_every_shop_of_the_account_and_no_other(): void
    {
        $admin = $this->admin();
        $foreign = Shop::factory()->create(['user_id' => User::factory()->create(['role' => 'super_admin'])->id]);

        $this->assertEqualsCanonicalizing(
            [$this->main->id, $this->second->id],
            $admin->accessibleShopsQuery()->pluck('id')->all()
        );

        $this->actingAs($admin)->get('/__binding-probe/' . $this->sale($this->second)->id)->assertOk();
        $this->actingAs($admin)->get('/__binding-probe/' . $this->sale($foreign)->id)->assertNotFound();
    }

    public function test_an_admin_keeps_out_of_owner_only_areas(): void
    {
        $admin = $this->admin();
        $code = $this->owner->code_user;

        $this->assertFalse($admin->canCreateShop());
        $this->actingAs($admin)->get("/{$code}/integrations")->assertForbidden();
        $this->actingAs($admin)->post("/{$code}/boutiques", ['name' => 'La mienne'])->assertForbidden();
        $this->actingAs($admin)->delete("/{$code}/boutiques/{$this->second->id}")->assertForbidden();
        $this->assertSame(2, Shop::where('user_id', $this->owner->id)->count());
    }

    public function test_an_admin_manages_staff_but_not_the_owner_or_another_admin(): void
    {
        $admin = $this->admin();
        $other = $this->admin();
        $code = $this->owner->code_user;

        $this->invite($admin, ['role' => 'admin', 'shop_id' => $this->second->id])->assertSessionHasErrors('role');

        // Un caissier dans une autre boutique du compte que la sienne.
        $this->invite($admin, ['role' => 'cashier', 'shop_id' => $this->second->id])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['email' => 'invite@example.com', 'shop_id' => $this->second->id]);

        $this->actingAs($admin)->get("/{$code}/users/{$other->id}/edit")->assertForbidden();
        $this->actingAs($admin)->delete("/{$code}/users/{$other->id}")->assertForbidden();
        // Le propriétaire a ici un shop_id (comptes anciens) : la garde de boutique ne suffit pas.
        $this->actingAs($admin)->delete("/{$code}/users/{$this->owner->id}")->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $this->owner->id]);
    }

    public function test_the_repair_command_turns_an_invited_owner_into_an_admin(): void
    {
        $ghost = User::factory()->create(['role' => 'super_admin', 'shop_id' => null]);
        ActivityLog::create([
            'action' => 'create', 'subject_type' => User::class, 'subject_id' => $ghost->id,
            'user_id' => $this->owner->id, 'user_email' => $this->owner->email, 'shop_id' => $this->second->id,
        ]);

        // Un fantôme qui a un abonnement à son nom : décision humaine, on n'y touche pas.
        $paying = User::factory()->create(['role' => 'super_admin', 'shop_id' => null]);
        $this->subscribeAccount($paying->id);
        ActivityLog::create([
            'action' => 'create', 'subject_type' => User::class, 'subject_id' => $paying->id,
            'user_id' => $this->owner->id, 'user_email' => $this->owner->email, 'shop_id' => $this->main->id,
        ]);

        $this->artisan('users:repair-invited-owners')->assertSuccessful();
        $this->assertSame('super_admin', $ghost->fresh()->role);

        $this->artisan('users:repair-invited-owners', ['--fix' => true])
            ->expectsConfirmation('Convert these 1 account(s) to admin of the listed shop?', 'yes')
            ->assertSuccessful();

        $ghost->refresh();
        $this->assertSame('admin', $ghost->role);
        $this->assertSame($this->second->id, $ghost->shop_id);
        $this->assertSame($this->owner->id, $ghost->ownerId());
        $this->assertSame('super_admin', $paying->fresh()->role);
    }
}
