<?php

namespace Tests\Feature\Sale;

use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Annuler ou réactiver une vente dépend de la case cochée, pas du rôle : un caissier à
 * qui le propriétaire donne « Annuler une vente » était refusé quand même.
 */
class PermissionNotRoleTest extends TestCase
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

    private function cashier(array $grants = []): User
    {
        $user = User::factory()->create(['role' => 'cashier', 'shop_id' => $this->shop->id]);
        foreach ($grants as $module => $action) {
            UserPermission::create(['user_id' => $user->id, 'module' => $module, "can_{$action}" => true]);
        }

        return $user;
    }

    private function sale(string $status = 'completed', $date = null): Sale
    {
        return Sale::create([
            'shop_id' => $this->shop->id, 'user_id' => $this->owner->id, 'sale_date' => $date ?? now(),
            'payment_method' => 'cash', 'status' => $status, 'subtotal' => 1000, 'tax_amount' => 0,
            'discount_amount' => 0, 'total' => 1000, 'amount_paid' => 1000, 'change_amount' => 0,
            'remaining_amount' => 0,
        ]);
    }

    public function test_a_cashier_granted_the_permission_cancels_a_sale_of_the_day(): void
    {
        $sale = $this->sale();

        $this->actingAs($this->cashier(['sales_delete' => 'delete']))
            ->delete("/{$this->owner->code_user}/ventes/{$sale->id}");

        $this->assertSame('cancelled', $sale->fresh()->status);
    }

    public function test_without_the_permission_the_cashier_is_refused(): void
    {
        $sale = $this->sale();

        $this->actingAs($this->cashier())
            ->delete("/{$this->owner->code_user}/ventes/{$sale->id}")
            ->assertForbidden();

        $this->assertSame('completed', $sale->fresh()->status);
    }

    public function test_the_permission_still_covers_the_day_only_for_staff(): void
    {
        $sale = $this->sale('completed', now()->subDays(2));

        $this->actingAs($this->cashier(['sales_delete' => 'delete']))
            ->delete("/{$this->owner->code_user}/ventes/{$sale->id}");

        $this->assertSame('completed', $sale->fresh()->status);
    }

    public function test_a_cashier_granted_restore_reactivates_a_cancelled_sale(): void
    {
        $sale = $this->sale('cancelled');

        $this->actingAs($this->cashier(['sales_restore' => 'view']))
            ->patch("/{$this->owner->code_user}/ventes/{$sale->id}/reactiver")
            ->assertSessionMissing('error');

        $this->assertNotSame('cancelled', $sale->fresh()->status);
    }
}
