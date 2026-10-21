<?php

namespace Tests\Feature\Import;

use App\Imports\DepotStockImport;
use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DepotStockImportTest extends TestCase
{
    use RefreshDatabase;

    private Depot $depot;
    private Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $owner = User::factory()->create(['role' => 'super_admin']);
        $this->shop = Shop::factory()->create(['user_id' => $owner->id]);
        $this->depot = Depot::factory()->create(['user_id' => $owner->id, 'code_user' => $owner->code_user]);
    }

    private function import(array $rows): DepotStockImport
    {
        $import = new DepotStockImport($this->depot, [$this->shop->id], $this->shop->id);
        $import->collection(new Collection(array_map(fn ($r) => new Collection($r), $rows)));

        return $import;
    }

    /**
     * The bug this guards: matching on name alone made "Perceuse 500W" Bosch and
     * "Perceuse 500W" Makita the same product, so each row overwrote the previous one.
     */
    public function test_same_name_under_different_brands_imports_as_distinct_products(): void
    {
        $this->import([
            ['nom' => 'Perceuse 500W', 'marque' => 'Bosch', 'quantite' => 5],
            ['nom' => 'Perceuse 500W', 'marque' => 'Makita', 'quantite' => 3],
        ]);

        $this->assertSame(2, Product::where('name', 'Perceuse 500W')->count());
        $this->assertSame(5, $this->quantityFor('Perceuse 500W', 'Bosch'));
        $this->assertSame(3, $this->quantityFor('Perceuse 500W', 'Makita'));
    }

    public function test_the_same_branded_product_across_two_rows_is_matched_not_duplicated(): void
    {
        $this->import([
            ['nom' => 'Perceuse 500W', 'marque' => 'Bosch', 'quantite' => 5],
            ['nom' => 'Perceuse 500W', 'marque' => 'Bosch', 'quantite' => 4],
        ]);

        $this->assertSame(1, Product::where('name', 'Perceuse 500W')->count());
        $this->assertSame(9, $this->quantityFor('Perceuse 500W', 'Bosch'), 'quantities accumulate');
    }

    /**
     * An unbranded row must not silently attach to a branded product of the same name.
     */
    public function test_an_unbranded_row_is_a_different_product_from_a_branded_one(): void
    {
        $this->import([
            ['nom' => 'Marteau', 'marque' => 'Stanley', 'quantite' => 2],
            ['nom' => 'Marteau', 'quantite' => 7],
        ]);

        $this->assertSame(2, Product::where('name', 'Marteau')->count());
        $this->assertSame(2, $this->quantityFor('Marteau', 'Stanley'));
        $this->assertSame(7, $this->quantityFor('Marteau', null));
    }

    public function test_it_matches_an_existing_product_by_brand_rather_than_creating_one(): void
    {
        $existing = Product::factory()->create([
            'shop_id' => $this->shop->id,
            'name' => 'Scie circulaire',
            'brand' => 'Makita',
        ]);

        $import = $this->import([
            ['nom' => 'Scie circulaire', 'marque' => 'Makita', 'quantite' => 6],
        ]);

        $this->assertSame(0, $import->getImportedCount()['products_created']);
        $this->assertSame(6, DepotProduct::where('product_id', $existing->id)->value('quantity'));
    }

    public function test_sku_still_wins_over_name_and_brand(): void
    {
        $existing = Product::factory()->create([
            'shop_id' => $this->shop->id,
            'sku' => 'SKU-123',
            'name' => 'Ancien nom',
            'brand' => 'Bosch',
        ]);

        $import = $this->import([
            ['sku' => 'SKU-123', 'nom' => 'Nom different', 'marque' => 'Makita', 'quantite' => 2],
        ]);

        $this->assertSame(0, $import->getImportedCount()['products_created']);
        $this->assertSame(2, DepotProduct::where('product_id', $existing->id)->value('quantity'));
    }

    /**
     * Each row runs in its own savepoint, so one unusable row must not take the rest
     * of the file down with it.
     */
    public function test_a_bad_row_does_not_discard_the_rows_around_it(): void
    {
        $import = $this->import([
            ['nom' => 'Tournevis', 'marque' => 'Facom', 'quantite' => 4],
            ['quantite' => 9], // no sku, no barcode, no name — unusable
            ['nom' => 'Pince', 'marque' => 'Facom', 'quantite' => 6],
        ]);

        $this->assertSame(4, $this->quantityFor('Tournevis', 'Facom'));
        $this->assertSame(6, $this->quantityFor('Pince', 'Facom'));
        $this->assertSame(1, $import->getImportedCount()['errors']);
        $this->assertCount(1, $import->getErrors());
    }

    public function test_brand_is_stored_on_products_it_creates(): void
    {
        $this->import([
            ['nom' => 'Niveau laser', 'marque' => 'Bosch', 'quantite' => 1],
        ]);

        $this->assertSame('Bosch', Product::where('name', 'Niveau laser')->value('brand'));
    }

    public function test_it_reads_the_brand_column_under_any_of_its_accepted_headings(): void
    {
        $this->import([
            ['nom' => 'Cle plate', 'brand' => 'Facom', 'quantite' => 1],
            ['nom' => 'Cle a molette', 'fabricant' => 'Stanley', 'quantite' => 1],
        ]);

        $this->assertSame('Facom', Product::where('name', 'Cle plate')->value('brand'));
        $this->assertSame('Stanley', Product::where('name', 'Cle a molette')->value('brand'));
    }

    /**
     * Two same-name products only coexist because the unique (shop_id, slug) constraint
     * was dropped on 2026-07-04. Should an environment still carry it, the conflicting
     * row must be refused and reported — never quietly folded into the product that
     * already owns the slug, which would merge one brand's stock into another's.
     */
    public function test_a_slug_conflict_is_reported_rather_than_merged_into_another_brand(): void
    {
        DB::statement('CREATE UNIQUE INDEX products_shop_slug_unique ON products (shop_id, slug)');

        try {
            $import = $this->import([
                ['nom' => 'Perceuse 500W', 'marque' => 'Bosch', 'quantite' => 5],
                ['nom' => 'Perceuse 500W', 'marque' => 'Makita', 'quantite' => 3],
            ]);

            $this->assertSame(5, $this->quantityFor('Perceuse 500W', 'Bosch'), "Bosch stock must not absorb Makita's");
            $this->assertSame(1, $import->getImportedCount()['errors'], 'the Makita row must be reported, not merged');
        } finally {
            DB::statement('DROP INDEX products_shop_slug_unique');
        }
    }

    private function quantityFor(string $name, ?string $brand): ?int
    {
        $query = Product::where('name', $name);
        $brand === null ? $query->whereNull('brand') : $query->where('brand', $brand);

        $product = $query->first();

        if (!$product) {
            return null;
        }

        return DepotProduct::where('depot_id', $this->depot->id)
            ->where('product_id', $product->id)
            ->value('quantity');
    }
}
