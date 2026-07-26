<?php

namespace Tests\Feature\Stock;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Ce que vaut le stock détenu, dépôts compris.
 *
 * Deux valorisations concurrentes coexistaient. `Product::stockValue()` ne couvrait que le
 * comptoir, alors que l'interface l'annonce « Valeur du stock » sans réserve : tout ce qui
 * dormait en réserve était absent du chiffre censé dire où est immobilisée la trésorerie. Et la
 * page dépôt valorisait, elle, au `purchase_price` de la ligne de dépôt — un champ à saisir qui
 * vaut 0 par défaut, donc une réserve pleine valant zéro.
 *
 * Une seule base de coût désormais : celle du produit. L'endroit où se trouve la marchandise ne
 * change pas ce qu'elle a coûté.
 */
class DepotValuationTest extends TestCase
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

    private function product(int $counter, ?float $average, float $purchasePrice = 0): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'stock_quantity' => $counter,
            'average_cost' => $average,
            'purchase_price' => $purchasePrice,
            'is_active' => true,
            'parent_id' => null,
        ]);
    }

    private function depot(): Depot
    {
        // Un dépôt appartient au COMPTE (`code_user`), pas à une boutique : la table n'a pas de
        // shop_id. Ce sont les produits qu'il contient qui portent leur boutique.
        return Depot::create([
            'code_user' => $this->user->code_user,
            'user_id' => $this->user->id,
            'name' => 'Réserve',
            'is_active' => true,
        ]);
    }

    private function store(Depot $depot, Product $product, int $quantity, float $linePrice = 0): DepotProduct
    {
        return DepotProduct::create([
            'depot_id' => $depot->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'purchase_price' => $linePrice,
        ]);
    }

    public function test_the_stock_value_covers_the_depots(): void
    {
        $product = $this->product(counter: 10, average: 1000);
        $this->store($this->depot(), $product, 40);

        // 50 unités détenues à 1 000, et non les 10 du comptoir seules.
        $this->assertSame(50, $product->totalStock());
        $this->assertSame(50000.0, $product->stockValue());
    }

    public function test_the_counter_value_stays_available_on_its_own(): void
    {
        $product = $this->product(counter: 10, average: 1000);
        $this->store($this->depot(), $product, 40);

        $this->assertSame(10000.0, $product->counterStockValue());
    }

    /**
     * Le point décisif : le coût vient du produit, pas de la ligne de dépôt. Ce champ vaut 0
     * tant que personne ne l'a saisi, et valorisait donc à zéro une réserve pleine.
     */
    public function test_the_depot_line_price_is_not_the_cost_basis(): void
    {
        $product = $this->product(counter: 0, average: 1200);
        $this->store($this->depot(), $product, 25, linePrice: 0);

        $this->assertSame(30000.0, $product->stockValue());
    }

    /** Sans moyenne établie, le prix d'achat du produit prend le relais — jamais un zéro. */
    public function test_without_an_average_the_purchase_price_values_the_depot(): void
    {
        $product = $this->product(counter: 0, average: null, purchasePrice: 800);
        $this->store($this->depot(), $product, 5);

        $this->assertSame(4000.0, $product->stockValue());
    }

    public function test_stock_spread_over_several_depots_is_all_counted(): void
    {
        $product = $this->product(counter: 3, average: 100);
        $this->store($this->depot(), $product, 7);
        $this->store($this->depot(), $product, 10);

        $this->assertSame(20, $product->totalStock());
        $this->assertSame(2000.0, $product->stockValue());
    }

    public function test_a_product_without_a_depot_is_unaffected(): void
    {
        $product = $this->product(counter: 12, average: 250);

        $this->assertSame(3000.0, $product->stockValue());
        $this->assertSame($product->counterStockValue(), $product->stockValue());
    }

    /**
     * La somme jointe est reconnue sous ses deux alias. La liste des produits joint
     * `depot_stock` ; ne reconnaître que le nom par défaut de withSum ramenait une requête par
     * produit, malgré la jointure.
     */
    public function test_the_joined_sum_is_used_under_either_alias(): void
    {
        $product = $this->product(counter: 5, average: 100);
        $this->store($this->depot(), $product, 15);

        foreach (['depot_stock', 'depot_products_sum_quantity'] as $alias) {
            $loaded = Product::withSum("depotProducts as {$alias}", 'quantity')->find($product->id);

            $queries = 0;
            DB::listen(function () use (&$queries) {
                $queries++;
            });

            $this->assertSame(2000.0, $loaded->stockValue(), "alias {$alias}");
            $this->assertSame(0, $queries, "alias {$alias} : la somme jointe doit suffire");
        }
    }

    public function test_the_shop_page_counts_the_depots_in_its_totals(): void
    {
        $product = $this->product(counter: 10, average: 1000);
        $this->store($this->depot(), $product, 40);

        $response = $this->actingAs($this->user)
            ->get(route('shops.show', ['code_user' => $this->user->code_user, 'shop' => $this->shop->id]))
            ->assertOk();

        $stats = $response->viewData('page')['props']['stats'];
        $this->assertSame(50, $stats['stock_units']);
        $this->assertSame(50000.0, $stats['stock_value']);
    }

    public function test_the_depot_page_values_its_stock_at_the_product_cost(): void
    {
        $depot = $this->depot();
        $product = $this->product(counter: 0, average: 1200);
        $this->store($depot, $product, 25, linePrice: 0);

        $response = $this->actingAs($this->user)
            ->get(route('depots.show', ['code_user' => $this->user->code_user, 'depot' => $depot->id]))
            ->assertOk();

        $props = $response->viewData('page')['props'];

        // Auparavant : 0, la ligne de dépôt n'ayant pas de prix saisi.
        $this->assertSame(30000.0, $props['stats']['total_value']);

        $line = $props['products']['data'][0];
        $this->assertSame(1200.0, $line['unit_cost']);
        $this->assertSame(30000.0, $line['stock_value']);
    }
}
