<?php

namespace Tests\Feature\Api\V1;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Une vente créée par l'API (v1 ou route mobile) ne peut citer que des clients et
 * des produits de la boutique visée. Sans cette garde, un compte pouvait déstocker
 * le produit d'un autre commerçant.
 */
class SaleTenantScopeTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop} */
    private function ownerWithShop(): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        return [$user, $shop];
    }

    private function salePayload(Shop $shop, Product $product, ?Customer $customer = null): array
    {
        return [
            'shop_id' => $shop->id,
            'customer_id' => $customer?->id,
            'payment_method' => 'cash',
            'amount_paid' => 1000,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 1000],
            ],
        ];
    }

    public function test_v1_rejects_a_product_from_another_account(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $foreignProduct = Product::factory()->create([
            'shop_id' => Shop::factory()->create()->id,
            'stock_quantity' => 10,
        ]);

        Sanctum::actingAs($user, ['sales:write']);

        $this->postJson('/api/v1/sales', $this->salePayload($shop, $foreignProduct))
            ->assertStatus(422)
            ->assertJsonValidationErrors('items.0.product_id');

        $this->assertSame(10, $foreignProduct->fresh()->stock_quantity);
    }

    public function test_v1_rejects_a_customer_from_another_account(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $product = Product::factory()->create(['shop_id' => $shop->id, 'stock_quantity' => 10]);
        $foreignCustomer = Customer::factory()->create(['shop_id' => Shop::factory()->create()->id]);

        Sanctum::actingAs($user, ['sales:write']);

        $this->postJson('/api/v1/sales', $this->salePayload($shop, $product, $foreignCustomer))
            ->assertStatus(422)
            ->assertJsonValidationErrors('customer_id');
    }

    public function test_mobile_route_rejects_a_product_from_another_account(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $foreignProduct = Product::factory()->create([
            'shop_id' => Shop::factory()->create()->id,
            'stock_quantity' => 10,
        ]);

        Sanctum::actingAs($user, ['sales:write']);

        $this->postJson('/api/sales', $this->salePayload($shop, $foreignProduct))
            ->assertStatus(422)
            ->assertJsonValidationErrors('items.0.product_id');

        $this->assertSame(10, $foreignProduct->fresh()->stock_quantity);
    }

    public function test_a_sale_with_the_shops_own_product_still_goes_through(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        $product = Product::factory()->create(['shop_id' => $shop->id, 'stock_quantity' => 10]);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        Sanctum::actingAs($user, ['sales:write']);

        $this->postJson('/api/v1/sales', $this->salePayload($shop, $product, $customer))
            ->assertCreated();
    }
}
