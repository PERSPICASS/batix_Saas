<?php

namespace Tests\Feature\Stock;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le prix d'un dépôt comble un vide, il n'écrase jamais.
 *
 * Un transfert dépôt → boutique réécrivait sans condition le `purchase_price` du produit de la
 * boutique. Or un dépôt appartient au COMPTE et peut alimenter plusieurs boutiques : une seule
 * ligne de dépôt pouvait donc imposer son prix à des produits de boutiques différentes, alors
 * que chaque boutique garde les siens. Et ce prix n'est pas décoratif — c'est le repli de
 * `Product::unitCost()` en l'absence de moyenne pondérée, donc une base de valorisation.
 *
 * Le transfert dépôt → dépôt appliquait déjà cette règle ; les deux chemins se contredisaient.
 */
class DepotPricePropagationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $shop;
    private Depot $depot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'super_admin']);
        $this->shop = Shop::factory()->create(['user_id' => $this->user->id]);
        $this->user->update(['shop_id' => $this->shop->id]);
        $this->user = $this->user->fresh();

        $this->depot = Depot::create([
            'code_user' => $this->user->code_user,
            'user_id' => $this->user->id,
            'name' => 'Réserve',
            'is_active' => true,
        ]);
    }

    private function product(float $purchasePrice): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'stock_quantity' => 0,
            'purchase_price' => $purchasePrice,
            'average_cost' => null,
            'is_active' => true,
            'parent_id' => null,
            'track_stock' => true,
        ]);
    }

    private function inDepot(Product $product, int $quantity, float $price): DepotProduct
    {
        return DepotProduct::create([
            'depot_id' => $this->depot->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'purchase_price' => $price,
        ]);
    }

    private function transferToShop(Product $product, int $quantity)
    {
        return $this->actingAs($this->user)->post(
            route('depots.transfer', ['code_user' => $this->user->code_user, 'depot' => $this->depot->id]),
            [
                'shop_id' => $this->shop->id,
                'items' => [['product_id' => $product->id, 'quantity' => $quantity]],
            ]
        );
    }

    public function test_a_shop_keeps_its_own_purchase_price(): void
    {
        $product = $this->product(purchasePrice: 1200);
        $this->inDepot($product, 10, price: 800);

        $this->transferToShop($product, 4);

        // Auparavant : 800, le prix du dépôt s'imposait à la boutique.
        $this->assertSame('1200.00', $product->fresh()->purchase_price);
    }

    /**
     * Le piège qui rendait la garde inopérante si elle était écrite naïvement :
     * `purchase_price` est casté en decimal:2, donc l'attribut vaut la chaîne « 0.00 » — vraie
     * en PHP. Un `!$product->purchase_price` n'aurait jamais rempli.
     */
    public function test_a_product_without_a_price_takes_the_depot_one(): void
    {
        $product = $this->product(purchasePrice: 0);
        $this->inDepot($product, 10, price: 800);

        $this->transferToShop($product, 4);

        $this->assertSame('800.00', $product->fresh()->purchase_price);
    }

    /** Un dépôt sans prix ne vide pas celui de la boutique. */
    public function test_a_depot_without_a_price_changes_nothing(): void
    {
        $product = $this->product(purchasePrice: 1200);
        $this->inDepot($product, 10, price: 0);

        $this->transferToShop($product, 4);

        $this->assertSame('1200.00', $product->fresh()->purchase_price);
    }

    /**
     * Le cas qui motive la règle : un dépôt appartient au compte et sert plusieurs boutiques.
     * Chacune doit conserver son prix.
     */
    public function test_two_shops_fed_by_one_depot_keep_their_own_prices(): void
    {
        $otherShop = Shop::factory()->create(['user_id' => $this->user->id]);

        $here = $this->product(purchasePrice: 1200);
        $there = Product::factory()->create([
            'shop_id' => $otherShop->id,
            'stock_quantity' => 0,
            'purchase_price' => 1500,
            'average_cost' => null,
            'is_active' => true,
            'parent_id' => null,
            'track_stock' => true,
        ]);

        $this->inDepot($here, 10, price: 800);
        $this->inDepot($there, 10, price: 800);

        $this->transferToShop($here, 4);
        $this->actingAs($this->user)->post(
            route('depots.transfer', ['code_user' => $this->user->code_user, 'depot' => $this->depot->id]),
            ['shop_id' => $otherShop->id, 'items' => [['product_id' => $there->id, 'quantity' => 4]]]
        );

        $this->assertSame('1200.00', $here->fresh()->purchase_price);
        $this->assertSame('1500.00', $there->fresh()->purchase_price);
    }

    /** La valorisation suit le prix conservé, sinon la garde n'aurait pas d'effet visible. */
    public function test_the_valuation_follows_the_kept_price(): void
    {
        $product = $this->product(purchasePrice: 1200);
        $this->inDepot($product, 10, price: 800);

        $this->transferToShop($product, 4);

        // 4 au comptoir + 6 restées en dépôt, à 1 200.
        $product = $product->fresh();
        $this->assertSame(1200.0, $product->unitCost());
        $this->assertSame(12000.0, $product->stockValue());
    }
}
