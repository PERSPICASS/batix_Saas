<?php

namespace Tests\Feature\Api\V1;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Recherche tolérante : casse, accents, format des numéros.
 *
 * ATTENTION à ce que ces tests peuvent et ne peuvent pas prouver. La suite tourne sur
 * SQLite, dont le `LIKE` ignore déjà la casse : un test « je cherche pistolet, je trouve
 * Pistolet » y passerait au vert AVEC le bug. La production, elle, est sur PostgreSQL, où
 * `LIKE` distingue les majuscules et où les accents ne se réduisent pas tout seuls.
 *
 * D'où deux niveaux :
 *  - le SQL produit pour PostgreSQL est inspecté (translate + ILIKE) : c'est la seule
 *    vérification qui porte réellement sur le comportement de la prod ;
 *  - les recherches réelles sur SQLite vérifient que la requête reste valide et scopée.
 */
class SearchCaseSensitivityTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Shop} */
    private function ownerWithShop(): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        return [$user, $shop];
    }

    /**
     * SQL que produirait la recherche sur PostgreSQL.
     *
     * Ni `toSql()` ni la grammaire n'ouvrent de connexion : aucun serveur PostgreSQL
     * n'est requis pour faire tourner ce test.
     */
    private function postgresSearchSql(array $columns, string $term): string
    {
        config(['database.connections.pgsql_probe' => [
            'driver' => 'pgsql',
            'host' => '127.0.0.1',
            'database' => 'probe',
            'username' => 'probe',
            'password' => '',
        ]]);

        $probe = new class
        {
            use \App\Http\Controllers\Api\V1\Concerns\SearchesText;

            public function search($query, array $columns, string $term)
            {
                return $this->applyTextSearch($query, $columns, $term);
            }

            public function digits($query, string $column, string $term)
            {
                return $this->orWhereSameDigits($query, $column, $term);
            }
        };

        return $probe->search(Product::on('pgsql_probe')->newQuery(), $columns, $term)->toSql();
    }

    public function test_postgres_search_neutralises_case_and_accents(): void
    {
        $sql = strtolower($this->postgresSearchSql(['name', 'sku'], 'electrique'));

        // C'est la seule assertion qui porte sur le comportement réel de la production.
        // ILIKE seul ne suffirait pas : « electrique » doit trouver « électrique », d'où
        // le translate() de part et d'autre de la comparaison.
        $this->assertStringContainsString('ilike', $sql);
        $this->assertStringContainsString('translate(', $sql);
        $this->assertStringContainsString('"name"', $sql);
        $this->assertStringContainsString('"sku"', $sql);
    }

    public function test_search_is_case_insensitive_end_to_end(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Pistolet à peinture électrique 600W']);

        Sanctum::actingAs($user, ['products:read']);

        $this->getJson('/api/v1/products?search=' . urlencode('pistolet') . '&shop_id=' . $shop->id)
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_a_customer_is_found_by_phone_whatever_its_formatting(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        Customer::factory()->create([
            'shop_id' => $shop->id,
            'name' => 'Matthieu Aka',
            'phone' => '+225 09 87 65 43 22',
        ]);

        Sanctum::actingAs($user, ['customers:read']);

        // Le tool MCP annonce la recherche par téléphone ; l'endpoint ne cherchait que
        // sur le nom, et la mise en forme du numéro faisait échouer le reste.
        $this->getJson('/api/v1/customers?search=' . urlencode('+2250987654322') . '&shop_id=' . $shop->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Matthieu Aka');
    }

    public function test_a_customer_is_found_by_email(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        Customer::factory()->create([
            'shop_id' => $shop->id,
            'name' => 'Matthieu Aka',
            'email' => 'matthieu@example.com',
        ]);

        Sanctum::actingAs($user, ['customers:read']);

        $this->getJson('/api/v1/customers?search=' . urlencode('matthieu@example.com') . '&shop_id=' . $shop->id)
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_a_product_is_found_by_its_brand(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        Product::factory()->create([
            'shop_id' => $shop->id,
            'name' => 'Pistolet à peinture électrique 600W',
            'brand' => 'Tolsen',
        ]);

        Sanctum::actingAs($user, ['products:read']);

        // L'API renvoie la marque, donc l'assistant la cite à l'utilisateur ; ne pas
        // pouvoir la rechercher rendait ce dialogue impossible à conclure.
        $this->getJson('/api/v1/products?search=' . urlencode('Tolsen') . '&shop_id=' . $shop->id)
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_words_spread_across_columns_all_count(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        Product::factory()->create([
            'shop_id' => $shop->id,
            'name' => 'Pistolet à peinture électrique 600W',
            'brand' => 'Tolsen',
        ]);
        Product::factory()->create([
            'shop_id' => $shop->id,
            'name' => 'Pistolet à peinture électrique 400W',
            'brand' => 'Bosch',
        ]);

        Sanctum::actingAs($user, ['products:read']);

        // Aucune colonne ne contient « pistolet 600W tolsen » : le mot « tolsen » est
        // dans `brand`, le reste dans `name`. Chaque mot doit compter séparément.
        $this->getJson('/api/v1/products?search=' . urlencode('pistolet 600w tolsen') . '&shop_id=' . $shop->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.brand', 'Tolsen');
    }

    public function test_search_still_respects_the_shop_boundary(): void
    {
        [$user, $shop] = $this->ownerWithShop();
        Product::factory()->create(['shop_id' => $shop->id, 'name' => 'Pistolet maison']);

        $foreign = Shop::factory()->create();
        Product::factory()->create(['shop_id' => $foreign->id, 'name' => 'Pistolet étranger']);

        Sanctum::actingAs($user, ['products:read']);

        // Une recherche plus permissive ne doit pas être une recherche plus large.
        $this->getJson('/api/v1/products?search=' . urlencode('pistolet') . '&shop_id=' . $shop->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Pistolet maison');
    }
}
