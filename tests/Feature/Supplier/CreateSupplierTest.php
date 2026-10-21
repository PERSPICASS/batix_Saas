<?php

namespace Tests\Feature\Supplier;

use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateSupplierTest extends TestCase
{
    use RefreshDatabase;

    private function superAdminOwning(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $user;
    }

    public function test_a_supplier_can_be_created_without_a_country(): void
    {
        // Regression: suppliers.country was NOT NULL with a default, but the form
        // sends null when empty; on Postgres that crashed with a not-null
        // violation. The column is now nullable with no default.
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);

        $response = $this->actingAs($user)->post("/{$user->code_user}/suppliers", [
            'shop_ids' => [$shop->id],
            'name' => 'Koffi koffi',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('suppliers', [
            'name' => 'Koffi koffi',
            'country' => null,
        ]);
    }

    public function test_a_provided_country_is_still_stored(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);

        $this->actingAs($user)->post("/{$user->code_user}/suppliers", [
            'shop_ids' => [$shop->id],
            'name' => 'Dieng Distribution',
            'country' => 'Sénégal',
        ])->assertSessionHasNoErrors();

        $this->assertSame('Sénégal', Supplier::where('name', 'Dieng Distribution')->first()->country);
    }
}
