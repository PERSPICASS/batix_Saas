<?php

namespace Tests\Feature\Stock;

use App\Imports\DepotStockImport;
use App\Imports\ProductsImport;
use App\Models\Depot;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

/**
 * Tout stock qui entre laisse un mouvement, même quand il naît avec le produit.
 *
 * Le 2026-10-28, `stock:audit` remontait 4 089 écarts en prod : la création d'un produit
 * avec un stock initial, l'import de produits et l'import de stock en dépôt posaient le
 * compteur sans rien écrire au registre.
 */
class StockEnteredWithoutMovementTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    private function assertLedgerAddsUp(): void
    {
        $this->artisan('stock:audit')->expectsOutputToContain('Aucun écart')->assertSuccessful();
    }

    private function rows(array $rows): Collection
    {
        return new Collection(array_map(fn ($r) => new Collection($r), $rows));
    }

    public function test_a_product_created_with_stock(): void
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/produits", [
            'shop_id' => $this->shop->id, 'name' => 'Ciment 50kg', 'unit' => 'piece',
            'purchase_price' => 4000, 'selling_price' => 5000, 'stock_quantity' => 120, 'track_stock' => true,
        ])->assertSessionHasNoErrors();

        $this->assertSame(120.0, Product::where('name', 'Ciment 50kg')->sole()->stock_quantity);
        $this->assertLedgerAddsUp();
    }

    public function test_the_product_import_creating_then_rewriting_stock(): void
    {
        (new ProductsImport($this->shop->id))->collection($this->rows([
            ['nom' => 'Deluxi 1kg', 'prix_achat' => 900, 'prix_vente' => 1200, 'stock' => 2200],
        ]));
        $this->assertLedgerAddsUp();

        // Réimporté avec un stock plus bas : le compteur est réécrit, l'écart doit l'être aussi.
        (new ProductsImport($this->shop->id))->collection($this->rows([
            ['nom' => 'Deluxi 1kg', 'prix_achat' => 900, 'prix_vente' => 1200, 'stock' => 5],
        ]));
        $this->assertSame(5.0, Product::where('name', 'Deluxi 1kg')->sole()->stock_quantity);
        $this->assertLedgerAddsUp();
    }

    public function test_the_depot_stock_import_new_and_existing_lines(): void
    {
        $depot = Depot::factory()->create(['user_id' => $this->owner->id, 'code_user' => $this->owner->code_user]);
        $import = fn () => (new DepotStockImport($depot, [$this->shop->id], $this->shop->id))
            ->collection($this->rows([['nom' => 'Panneau polystyrène 15mm', 'quantite' => 2920]]));

        $import();
        $import();

        $this->assertLedgerAddsUp();
    }
}
