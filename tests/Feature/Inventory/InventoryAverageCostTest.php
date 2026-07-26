<?php

namespace Tests\Feature\Inventory;

use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * L'inventaire alimente le CUMP, un excédent étant valorisé au dernier prix d'achat.
 *
 * Jusqu'ici un inventaire ne touchait pas `products.average_cost` : des unités pouvaient
 * apparaître au stock sans que la valorisation en sache rien. Règle arrêtée le 2026-07-26 —
 * l'excédent entre dans la moyenne au dernier prix d'achat (`products.purchase_price`, ce que
 * l'inventaire capture par ligne dans `unit_cost`) ; un manque ne change pas la moyenne, une
 * sortie s'évaluant en CUMP au coût moyen courant.
 */
class InventoryAverageCostTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'super_admin']);
        $this->shop = Shop::factory()->create(['user_id' => $this->user->id]);
        $this->user->update(['shop_id' => $this->shop->id]);
        $this->user = $this->user->fresh();
    }

    private function product(int $stock, ?float $average, float $purchasePrice): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'stock_quantity' => $stock,
            'defective_stock_quantity' => 0,
            'average_cost' => $average,
            'purchase_price' => $purchasePrice,
            'is_active' => true,
            'parent_id' => null,
        ]);
    }

    private function countAndApply(Product $product, int $counted, ?int $defective = null): void
    {
        $inventory = Inventory::create([
            'shop_id' => $this->shop->id,
            'user_id' => $this->user->id,
            'inventory_date' => now()->toDateString(),
            'status' => 'draft',
        ]);

        InventoryItem::create([
            'inventory_id' => $inventory->id,
            'product_id' => $product->id,
            'expected_quantity' => $product->stock_quantity,
            'expected_defective_quantity' => $product->defective_stock_quantity,
            'counted_quantity' => $counted,
            'defective_quantity' => $defective,
            // Ce que le contrôleur y met : le prix d'achat du produit.
            'unit_cost' => $product->purchase_price,
        ]);

        $this->actingAs($this->user)->post(route('inventory.complete', [
            'code_user' => $this->user->code_user,
            'inventory' => $inventory->id,
        ]));
    }

    public function test_a_surplus_enters_the_average_at_the_last_purchase_price(): void
    {
        // 100 unités à 1 000 de moyenne, 20 excédentaires trouvées à 1 300 d'achat :
        // (100 × 1000 + 20 × 1300) / 120 = 1050.
        $product = $this->product(stock: 100, average: 1000, purchasePrice: 1300);

        $this->countAndApply($product, counted: 120);

        $product->refresh();
        $this->assertSame(120, $product->stock_quantity);
        $this->assertSame('1050.00', $product->average_cost);
    }

    public function test_a_shortfall_leaves_the_average_untouched(): void
    {
        // Une sortie s'évalue au coût moyen courant : elle ne le déplace pas.
        $product = $this->product(stock: 100, average: 1000, purchasePrice: 1300);

        $this->countAndApply($product, counted: 80);

        $product->refresh();
        $this->assertSame(80, $product->stock_quantity);
        $this->assertSame('1000.00', $product->average_cost);
    }

    public function test_an_exact_count_leaves_the_average_untouched(): void
    {
        $product = $this->product(stock: 100, average: 1000, purchasePrice: 1300);

        $this->countAndApply($product, counted: 100);

        $this->assertSame('1000.00', $product->fresh()->average_cost);
    }

    /** Sans moyenne établie, le prix d'achat sert de point de départ — pas un zéro. */
    public function test_a_product_without_an_average_starts_from_its_purchase_price(): void
    {
        // (100 × 900 + 20 × 900) / 120 = 900 : la moyenne s'initialise sans s'effondrer.
        $product = $this->product(stock: 100, average: null, purchasePrice: 900);

        $this->countAndApply($product, counted: 120);

        $this->assertSame('900.00', $product->fresh()->average_cost);
    }

    /**
     * Un excédent sur un stock parti de zéro prend le prix d'achat pour moyenne : c'est le cas
     * d'un produit jamais reçu formellement mais physiquement présent.
     */
    public function test_a_surplus_from_an_empty_stock_takes_the_purchase_price(): void
    {
        $product = $this->product(stock: 0, average: null, purchasePrice: 750);

        $this->countAndApply($product, counted: 12);

        $product->refresh();
        $this->assertSame(12, $product->stock_quantity);
        $this->assertSame('750.00', $product->average_cost);
    }

    /** Une ligne non comptée ne valorise rien : elle n'a rien constaté. */
    public function test_an_uncounted_line_does_not_touch_the_average(): void
    {
        $counted = $this->product(stock: 10, average: 500, purchasePrice: 500);
        $skipped = $this->product(stock: 100, average: 1000, purchasePrice: 1300);

        $inventory = Inventory::create([
            'shop_id' => $this->shop->id, 'user_id' => $this->user->id,
            'inventory_date' => now()->toDateString(), 'status' => 'draft',
        ]);
        InventoryItem::create([
            'inventory_id' => $inventory->id, 'product_id' => $counted->id,
            'expected_quantity' => 10, 'counted_quantity' => 11, 'unit_cost' => 500,
        ]);
        InventoryItem::create([
            'inventory_id' => $inventory->id, 'product_id' => $skipped->id,
            'expected_quantity' => 100, 'counted_quantity' => null, 'unit_cost' => 1300,
        ]);

        $this->actingAs($this->user)->post(route('inventory.complete', [
            'code_user' => $this->user->code_user, 'inventory' => $inventory->id,
        ]));

        $this->assertSame('1000.00', $skipped->fresh()->average_cost);
        $this->assertSame(100, $skipped->fresh()->stock_quantity);
    }

    /** Le stock valorisé suit la nouvelle moyenne, sans quoi le correctif n'aurait pas d'effet. */
    public function test_the_stock_value_follows_the_new_average(): void
    {
        $product = $this->product(stock: 100, average: 1000, purchasePrice: 1300);

        $this->countAndApply($product, counted: 120);

        // 120 × 1050
        $this->assertSame(126000.0, $product->fresh()->stockValue());
    }
}
