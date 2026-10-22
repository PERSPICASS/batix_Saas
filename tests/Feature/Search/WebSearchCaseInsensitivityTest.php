<?php

namespace Tests\Feature\Search;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Les barres de recherche des listes web ignorent la casse et les accents.
 *
 * Comme pour l'API (SearchCaseSensitivityTest) : la suite tourne sur SQLite, dont le
 * `LIKE` ignore déjà la casse. Un test de résultat y passerait AVEC le bug ; seul le SQL
 * généré pour PostgreSQL porte sur le comportement de la prod.
 */
class WebSearchCaseInsensitivityTest extends TestCase
{
    use RefreshDatabase;

    private function postgresSql(callable $search): string
    {
        config(['database.connections.pgsql_probe' => [
            'driver' => 'pgsql', 'host' => '127.0.0.1', 'database' => 'probe', 'username' => 'probe', 'password' => '',
        ]]);

        // toSql() n'ouvre aucune connexion : pas besoin d'un serveur PostgreSQL.
        return strtolower($search(DB::connection('pgsql_probe')->table('products'))->toSql());
    }

    public function test_postgres_search_neutralises_case_and_accents(): void
    {
        $sql = $this->postgresSql(fn ($q) => $q->whereContains('name', 'ciment')->orWhereContains('sku', 'ciment'));

        $this->assertSame(2, substr_count($sql, 'ilike'));
        $this->assertStringContainsString('translate("name"', $sql);
        $this->assertStringContainsString('or translate("sku"', $sql);
        $this->assertStringNotContainsString(' like ', $sql);
    }

    /** Aucun `LIKE '%…%'` brut ne doit revenir dans un contrôleur : il distinguerait la casse en prod. */
    public function test_no_controller_searches_with_a_raw_like(): void
    {
        $offenders = [];

        foreach (glob(app_path('Http/Controllers/{,*/,*/*/}*.php'), GLOB_BRACE) as $file) {
            if (preg_match("/'like',\\s*[\"']%/i", file_get_contents($file))) {
                $offenders[] = basename($file);
            }
        }

        $this->assertSame([], $offenders);
    }

    public function test_the_product_and_customer_lists_still_search(): void
    {
        $shop = Shop::factory()->create();
        $owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $owner->id]);
        $this->subscribeOwnerOf($shop);

        Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Ciment CPJ 45', 'is_active' => true]);
        Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Brouette', 'is_active' => true]);
        Customer::factory()->create(['shop_id' => $shop->id, 'name' => 'Kouassi Aya']);

        $as = $this->actingAs($owner)->withSession(['active_shop_id' => $shop->id]);

        $as->get("/{$owner->code_user}/produits?search=ciment")->assertOk()
            ->assertInertia(fn ($page) => $page->has('products.data', 1)->where('products.data.0.name', 'Ciment CPJ 45'));

        $as->get("/{$owner->code_user}/clients?search=kouassi")->assertOk()
            ->assertInertia(fn ($page) => $page->has('customers.data', 1));
    }
}
