<?php

namespace Tests\Feature\TenantIsolation;

use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use App\Services\DocumentLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * BelongsToShop : la liaison de route ne résout que les enregistrements des
 * boutiques accessibles. Le test central est le premier — une route qui n'a
 * AUCUNE vérification manuelle reste fermée aux autres comptes.
 */
class RouteBindingScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Une action qui « oublie » sa vérification de boutique.
        Route::middleware(['web', 'auth'])->get('/__binding-probe/{sale}', fn (Sale $sale) => 'ok:' . $sale->id);
    }

    private function owner(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $user;
    }

    private function sale(Shop $shop): Sale
    {
        return Sale::create([
            'shop_id' => $shop->id,
            'user_id' => $shop->user_id,
            'sale_date' => now(),
            'payment_method' => 'cash',
            'status' => 'completed',
            'subtotal' => 1000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 1000,
            'amount_paid' => 1000,
            'change_amount' => 0,
            'remaining_amount' => 0,
        ]);
    }

    public function test_a_route_without_any_manual_check_still_hides_another_tenants_record(): void
    {
        $theirs = Shop::factory()->create();
        $this->owner($theirs);
        $sale = $this->sale($theirs);

        $this->actingAs($this->owner(Shop::factory()->create()))
            ->get("/__binding-probe/{$sale->id}")
            ->assertNotFound();
    }

    public function test_the_owner_still_reaches_their_own_record(): void
    {
        $shop = Shop::factory()->create();
        $owner = $this->owner($shop);
        $sale = $this->sale($shop);

        $this->actingAs($owner)->get("/__binding-probe/{$sale->id}")->assertOk()->assertSee('ok:' . $sale->id);
    }

    /** Un owner a plusieurs boutiques ; son employé n'a que la sienne. */
    public function test_staff_cannot_reach_another_shop_of_the_same_owner(): void
    {
        $first = Shop::factory()->create();
        $owner = $this->owner($first);
        $second = Shop::factory()->create(['user_id' => $owner->id]);
        $sale = $this->sale($second);

        $staff = User::factory()->create(['role' => 'manager', 'shop_id' => $first->id]);

        $this->actingAs($owner)->get("/__binding-probe/{$sale->id}")->assertOk();
        $this->actingAs($staff)->get("/__binding-probe/{$sale->id}")->assertNotFound();
    }

    public function test_a_suspended_shop_is_no_longer_reachable(): void
    {
        $shop = Shop::factory()->create();
        $owner = $this->owner($shop);
        $sale = $this->sale($shop);
        Shop::factory()->create(['user_id' => $owner->id]);
        $shop->update(['is_active' => false]);

        $this->actingAs($owner)->get("/__binding-probe/{$sale->id}")->assertNotFound();
    }

    public function test_the_platform_admin_is_not_scoped(): void
    {
        $shop = Shop::factory()->create();
        $this->owner($shop);
        $sale = $this->sale($shop);

        $this->actingAs(User::factory()->create(['role' => 'admin_platforme']))
            ->get("/__binding-probe/{$sale->id}")
            ->assertOk();
    }

    /**
     * Le client d'une boutique peut avoir lui-même un compte BATIX : le ticket signé
     * qu'on lui envoie sur WhatsApp doit s'ouvrir même s'il est connecté ailleurs.
     */
    public function test_a_signed_link_opens_for_a_user_logged_into_another_account(): void
    {
        $theirs = Shop::factory()->create();
        $this->owner($theirs);
        $sale = $this->sale($theirs);

        $this->actingAs($this->owner(Shop::factory()->create()))
            ->get(DocumentLink::forSale($sale))
            ->assertOk();
    }
}
