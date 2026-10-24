<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Depot;
use App\Models\DepotTransfer;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentNumberTest extends TestCase
{
    use RefreshDatabase;

    private function purchase(Shop $shop, ?string $reference = null): Purchase
    {
        return Purchase::create([
            'shop_id' => $shop->id,
            'supplier_id' => Supplier::create(['name' => 'ACME'])->id,
            'user_id' => User::factory()->create()->id,
            'order_date' => now()->toDateString(),
            'status' => 'draft',
            'reference' => $reference,
        ]);
    }

    private function quote(Shop $shop, string $number): Quote
    {
        return Quote::create([
            'shop_id' => $shop->id,
            'customer_id' => Customer::factory()->create()->id,
            'quote_number' => $number,
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addMonth()->toDateString(),
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);
    }

    public function test_the_purchase_counter_goes_past_9999(): void
    {
        // Regression: the next number was read from the last 4 characters of the
        // latest purchase, so PO-YYYY-10000 read as 0 and the counter restarted at
        // 0001 — a reference that already exists.
        $shop = Shop::factory()->create();
        $prefix = 'PO-' . date('Y') . '-';
        $this->purchase($shop, $prefix . '9999');
        $this->purchase($shop, $prefix . '10000');

        $this->assertSame($prefix . '10001', $this->purchase($shop)->reference);
    }

    public function test_a_deleted_quote_does_not_hand_its_number_out_again(): void
    {
        // Regression: the number was the COUNT of the month's quotes + 1. Deleting a
        // draft lowered the count, so the next quote got a number still in use.
        $shop = Shop::factory()->create();
        $prefix = 'QTE-' . now()->format('Ym') . '-';
        $first = $this->quote($shop, $prefix . '001');
        $this->quote($shop, $prefix . '002');
        $first->delete();

        $this->assertSame($prefix . '003', Quote::generateNumber($shop->id));
    }

    public function test_depot_transfers_are_numbered_per_shop(): void
    {
        // The generator used to count every shop's transfers; it now follows the
        // (shop_id, reference) unique constraint.
        [$busy, $fresh] = [Shop::factory()->create(), Shop::factory()->create()];
        $prefix = 'TRF-' . date('Y') . '-';

        foreach ([$busy, $busy, $fresh] as $shop) {
            $last = DepotTransfer::create([
                'depot_id' => Depot::factory()->create()->id,
                'shop_id' => $shop->id,
                'user_id' => User::factory()->create()->id,
                'product_id' => Product::factory()->create(['shop_id' => $shop->id])->id,
                'quantity' => 1,
            ]);
        }

        $this->assertSame($prefix . '0001', $last->reference);
        $this->assertSame($prefix . '0003', DepotTransfer::generateReference($busy->id));
    }
}
