<?php

namespace Tests\Feature\Stock;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\DepotTransfer;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * L'audit des prix possiblement écrasés par un transfert de dépôt.
 *
 * L'ancienne valeur n'étant journalisée nulle part, la commande ne peut produire qu'un faisceau
 * d'indices. Ces tests fixent ce qu'elle doit remonter, et surtout ce qu'elle ne doit PAS
 * remonter — un audit qui crie au loup partout ne sert à rien.
 */
class AuditDepotPricesCommandTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Shop $shop;
    private Depot $depot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'super_admin']);
        $this->shop = Shop::factory()->create(['user_id' => $this->user->id, 'name' => 'Quincaillerie']);
        $this->depot = Depot::create([
            'code_user' => $this->user->code_user,
            'user_id' => $this->user->id,
            'name' => 'Réserve',
            'is_active' => true,
        ]);
    }

    private function transferred(float $shopPrice, float $depotPrice, ?float $average = null, int $stock = 10): Product
    {
        $product = Product::factory()->create([
            'shop_id' => $this->shop->id,
            'purchase_price' => $shopPrice,
            'average_cost' => $average,
            'stock_quantity' => $stock,
            'parent_id' => null,
        ]);

        DepotProduct::create([
            'depot_id' => $this->depot->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'purchase_price' => $depotPrice,
        ]);

        DepotTransfer::create([
            'reference' => 'TR-' . uniqid(),
            'depot_id' => $this->depot->id,
            'shop_id' => $this->shop->id,
            'user_id' => $this->user->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'status' => 'completed',
            'transferred_at' => now(),
        ]);

        return $product;
    }

    public function test_it_reports_nothing_when_no_price_coincides(): void
    {
        $this->transferred(shopPrice: 1200, depotPrice: 800);

        $this->artisan('depots:audit-prices')
            ->expectsOutputToContain('Aucun prix de boutique ne coïncide')
            ->assertSuccessful();
    }

    public function test_a_coinciding_price_on_valued_stock_is_flagged(): void
    {
        $product = $this->transferred(shopPrice: 800, depotPrice: 800, average: null, stock: 10);

        $this->artisan('depots:audit-prices')
            ->expectsOutputToContain('1 produit(s) à vérifier')
            ->expectsOutputToContain($product->name)
            ->assertSuccessful();
    }

    /**
     * Une moyenne pondérée a pris le relais : `purchase_price` n'est plus la base de
     * valorisation, l'écrasement éventuel ne coûte donc rien.
     */
    public function test_a_product_with_a_weighted_average_is_set_aside(): void
    {
        $this->transferred(shopPrice: 800, depotPrice: 800, average: 950);

        $this->artisan('depots:audit-prices')
            ->expectsOutputToContain('1 autre(s) cas sans effet')
            ->assertSuccessful();
    }

    /** Sans stock restant, le prix ne valorise plus rien. */
    public function test_a_product_without_stock_is_set_aside(): void
    {
        $this->transferred(shopPrice: 800, depotPrice: 800, average: null, stock: 0);

        $this->artisan('depots:audit-prices')
            ->expectsOutputToContain('1 autre(s) cas sans effet')
            ->assertSuccessful();
    }

    /** Un prix de dépôt à zéro n'a jamais rien pu écraser : l'ancien code l'excluait déjà. */
    public function test_a_zero_depot_price_is_never_flagged(): void
    {
        $this->transferred(shopPrice: 0, depotPrice: 0);

        $this->artisan('depots:audit-prices')
            ->expectsOutputToContain('Aucun prix de boutique ne coïncide')
            ->assertSuccessful();
    }

    /** Sans transfert, aucune occasion d'écraser quoi que ce soit. */
    public function test_a_product_never_transferred_is_not_flagged(): void
    {
        $product = Product::factory()->create([
            'shop_id' => $this->shop->id,
            'purchase_price' => 800,
            'average_cost' => null,
            'stock_quantity' => 10,
            'parent_id' => null,
        ]);

        DepotProduct::create([
            'depot_id' => $this->depot->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'purchase_price' => 800,
        ]);

        $this->artisan('depots:audit-prices')
            ->expectsOutputToContain('Aucun prix de boutique ne coïncide')
            ->assertSuccessful();
    }

    public function test_it_writes_nothing(): void
    {
        $product = $this->transferred(shopPrice: 800, depotPrice: 800);
        $before = $product->fresh()->toArray();

        $this->artisan('depots:audit-prices')->assertSuccessful();

        $this->assertSame($before, $product->fresh()->toArray());
    }
}
