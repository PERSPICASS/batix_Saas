<?php

namespace Tests\Feature\Supplier;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierProductsTest extends TestCase
{
    use RefreshDatabase;

    private function superAdminOwning(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop->update(['user_id' => $user->id]);

        return $user;
    }

    private function supplierFor(Shop $shop): Supplier
    {
        $supplier = Supplier::create(['name' => 'ACME Supplies']);
        $supplier->shops()->attach($shop->id);

        return $supplier;
    }

    private function supplyProduct(Supplier $supplier, Shop $shop, Product $product): void
    {
        $purchase = Purchase::create([
            'shop_id' => $shop->id,
            'supplier_id' => $supplier->id,
            'user_id' => $shop->user_id,
            'order_date' => now()->toDateString(),
            'status' => 'confirmed',
        ]);

        PurchaseItem::create([
            'purchase_id' => $purchase->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity_ordered' => 3,
            'unit_price' => 10,
        ]);
    }

    public function test_products_are_resolved_through_purchases_without_a_supplier_id_column(): void
    {
        // Guards the regression: products has no supplier_id, so the relation
        // must reach products through supplier → purchases → purchase_items.
        $shop = Shop::factory()->create();
        $this->superAdminOwning($shop);
        $supplier = $this->supplierFor($shop);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        $this->supplyProduct($supplier, $shop, $product);

        $this->assertSame(1, $supplier->products()->count());
        $this->assertTrue($supplier->products()->get()->contains('id', $product->id));
    }

    public function test_a_product_supplied_by_several_purchases_is_counted_once(): void
    {
        $shop = Shop::factory()->create();
        $this->superAdminOwning($shop);
        $supplier = $this->supplierFor($shop);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        // Same product across two separate purchase orders.
        $this->supplyProduct($supplier, $shop, $product);
        $this->supplyProduct($supplier, $shop, $product);

        $this->assertSame(1, $supplier->products()->count());
    }

    public function test_show_page_lists_the_suppliers_products_in_the_expected_shape(): void
    {
        $shop = Shop::factory()->create();
        $user = $this->superAdminOwning($shop);
        $supplier = $this->supplierFor($shop);
        $product = Product::factory()->create([
            'shop_id' => $shop->id,
            'name' => 'Widget',
            'sku' => 'WID-1',
            'selling_price' => 42,
            'stock_quantity' => 7,
        ]);

        $this->supplyProduct($supplier, $shop, $product);

        $response = $this->actingAs($user)
            ->get("/{$user->code_user}/suppliers/{$supplier->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('supplier.products', 1)
            ->where('supplier.products.0.id', $product->id)
            ->where('supplier.products.0.name', 'Widget')
            ->where('supplier.products.0.sku', 'WID-1')
            ->where('supplier.products.0.price', 42)
            ->where('supplier.products.0.stock', 7)
        );
    }
}
