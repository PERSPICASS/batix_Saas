<?php

namespace Tests\Feature\Stock;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Shop;
use App\Models\User;
use App\Services\StockMovementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Valuing the stock at weighted average cost.
 *
 * `purchase_price` is the price of the LAST purchase, which does not say what the goods on
 * hand are worth. A shop that bought 100 bags at 4 000 then 100 at 5 000 holds 200 worth
 * 900 000, not 1 000 000. Nothing computed that figure — and it is the one that says where
 * the cash is tied up.
 */
class StockValuationTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $user->id]);
        $this->actingAs($user);
    }

    private function product(int $stock, ?float $purchasePrice = null, ?float $averageCost = null): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'track_stock' => true,
            'stock_quantity' => $stock,
            'purchase_price' => $purchasePrice ?? 0,
            'average_cost' => $averageCost,
        ]);
    }

    /**
     * Le service exige un bon de commande comme référence : il n'existe pas de factory,
     * on en crée un minimal.
     */
    private function receive(Product $product, int $quantity, ?float $unitCost): void
    {
        $purchase = Purchase::create([
            'shop_id' => $this->shop->id,
            'supplier_id' => Supplier::create(['name' => 'Fournisseur test'])->id,
            'user_id' => $this->shop->user_id,
            'reference' => 'PO-' . fake()->unique()->numerify('######'),
            'status' => 'received',
            'order_date' => now()->toDateString(),
        ]);

        StockMovementService::recordPurchaseReceipt(
            $product,
            $quantity,
            $unitCost,
            $this->shop->id,
            $purchase
        );
    }

    public function test_two_receipts_at_different_prices_average_out(): void
    {
        $product = $this->product(0);

        $this->receive($product, 100, 4000);
        $this->receive($product->fresh(), 100, 5000);

        $product->refresh();

        $this->assertSame('4500.00', (string) $product->average_cost);
        $this->assertSame(200, $product->stock_quantity);
        $this->assertSame(900000.0, $product->stockValue());
    }

    /**
     * The average is weighted by quantity, not a plain mean of the two prices.
     */
    public function test_the_average_is_weighted_by_quantity(): void
    {
        $product = $this->product(0);

        $this->receive($product, 10, 1000);
        $this->receive($product->fresh(), 90, 2000);

        // (10×1000 + 90×2000) / 100 = 1900, et non 1500.
        $this->assertSame('1900.00', (string) $product->fresh()->average_cost);
    }

    /**
     * Without an average yet, the last purchase price stands in — better a known
     * approximation than a zero that would erase the stock from the balance sheet.
     */
    public function test_the_purchase_price_stands_in_until_a_receipt_arrives(): void
    {
        $product = $this->product(50, purchasePrice: 3000);

        $this->assertSame(3000.0, $product->unitCost());
        $this->assertSame(150000.0, $product->stockValue());
    }

    /**
     * A receipt with no cost must not move the average: taking it as zero would collapse
     * the valuation on a single badly entered movement.
     */
    public function test_a_receipt_with_no_cost_leaves_the_average_alone(): void
    {
        $product = $this->product(0);
        $this->receive($product, 100, 4000);

        $this->receive($product->fresh(), 50, null);

        $this->assertSame('4000.00', (string) $product->fresh()->average_cost);
    }

    /**
     * Selling does not change what the remaining goods cost.
     */
    public function test_a_sale_leaves_the_average_alone(): void
    {
        $product = $this->product(0);
        $this->receive($product, 100, 4000);

        StockMovementService::recordSale($product->fresh(), 30, $this->shop->id);

        $product->refresh();

        $this->assertSame('4000.00', (string) $product->average_cost);
        $this->assertSame(70, $product->stock_quantity);
        $this->assertSame(280000.0, $product->stockValue());
    }

    /**
     * Existing stock keeps its value when a receipt arrives — the average blends the two,
     * it does not adopt the newcomer's price.
     */
    public function test_existing_stock_weighs_on_the_average(): void
    {
        $product = $this->product(100, purchasePrice: 4000);

        $this->receive($product, 100, 6000);

        // Le stock déjà là compte pour sa moitié : (100×4000 + 100×6000) / 200.
        $this->assertSame('5000.00', (string) $product->fresh()->average_cost);
    }
}
