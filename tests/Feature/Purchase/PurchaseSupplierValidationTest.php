<?php

namespace Tests\Feature\Purchase;

use App\Models\Product;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseSupplierValidationTest extends TestCase
{
    use RefreshDatabase;

    private function superAdminOwning(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $user;
    }

    private function payloadFor(Supplier $supplier, Product $product): array
    {
        return [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 5],
            ],
        ];
    }

    public function test_a_purchase_from_a_supplier_linked_to_the_shop_is_accepted(): void
    {
        // Regression: the supplier_id rule used Rule::exists()->whereExists(),
        // a method that does not exist on the validation rule builder, so the
        // page 500-ed before validation could even run.
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);

        $supplier = Supplier::create(['name' => 'ACME']);
        $supplier->shops()->attach($shop->id);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        $response = $this->actingAs($user)
            ->post("/{$user->code_user}/purchases", $this->payloadFor($supplier, $product));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('purchases', [
            'shop_id' => $shop->id,
            'supplier_id' => $supplier->id,
        ]);
    }

    public function test_a_supplier_not_linked_to_the_shop_is_rejected(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        // Supplier exists but belongs to another shop, so it must not validate.
        $otherShop = Shop::factory()->create();
        $foreignSupplier = Supplier::create(['name' => 'Foreign']);
        $foreignSupplier->shops()->attach($otherShop->id);

        $response = $this->actingAs($user)
            ->post("/{$user->code_user}/purchases", $this->payloadFor($foreignSupplier, $product));

        $response->assertSessionHasErrors('supplier_id');
        $this->assertDatabaseMissing('purchases', ['supplier_id' => $foreignSupplier->id]);
    }
}
