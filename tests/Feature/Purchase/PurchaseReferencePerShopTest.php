<?php

namespace Tests\Feature\Purchase;

use App\Models\Depot;
use App\Models\DepotTransfer;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseReferencePerShopTest extends TestCase
{
    use RefreshDatabase;

    private function purchaseFromNewShop(): Purchase
    {
        $shop = Shop::factory()->create();
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        $supplier = Supplier::create(['name' => 'ACME']);
        $supplier->shops()->attach($shop->id);
        $product = Product::factory()->create(['shop_id' => $shop->id]);

        $this->flushSession();
        $this->actingAs($user)
            ->post("/{$user->code_user}/purchases", [
                'supplier_id' => $supplier->id,
                'order_date' => now()->toDateString(),
                'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 5]],
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionMissing('error');

        return Purchase::withoutGlobalScopes()->where('shop_id', $shop->id)->sole();
    }

    public function test_two_shops_can_each_record_their_first_purchase_of_the_year(): void
    {
        // Regression: references are numbered per shop but the unique constraint was
        // global, so the second shop's PO-YYYY-0001 hit a duplicate key (prod, shop 16).
        $first = $this->purchaseFromNewShop();
        $second = $this->purchaseFromNewShop();

        $expected = 'PO-' . date('Y') . '-0001';
        $this->assertSame($expected, $first->reference);
        $this->assertSame($expected, $second->reference);
    }

    public function test_two_shops_can_each_record_their_first_depot_transfer_of_the_year(): void
    {
        $references = [];

        foreach ([Shop::factory()->create(), Shop::factory()->create()] as $shop) {
            $transfer = DepotTransfer::create([
                'reference' => 'TRF-' . date('Y') . '-0001',
                'depot_id' => Depot::factory()->create()->id,
                'shop_id' => $shop->id,
                'user_id' => User::factory()->create()->id,
                'product_id' => Product::factory()->create(['shop_id' => $shop->id])->id,
                'quantity' => 1,
            ]);
            $references[] = $transfer->reference;
        }

        $this->assertSame($references[0], $references[1]);
    }
}
