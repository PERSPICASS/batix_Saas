<?php

namespace Tests\Feature\Depot;

use App\Models\Depot;
use App\Models\DepotProduct;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class PaginationLinksTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;
    private Depot $depot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'super_admin']);
        $this->shop  = Shop::factory()->create(['user_id' => $this->owner->id]);
        $this->depot = Depot::factory()->create([
            'user_id'   => $this->owner->id,
            'code_user' => $this->owner->code_user,
        ]);

        $product = Product::factory()->create(['shop_id' => $this->shop->id]);
        DepotProduct::create([
            'depot_id'        => $this->depot->id,
            'product_id'      => $product->id,
            'quantity'        => 3,
            'min_stock_alert' => 0,
            'purchase_price'  => 0,
        ]);
    }

    /** @return string[] */
    private function paginationUrls(string $base = ''): array
    {
        $urls = [];

        $this->actingAs($this->owner)
            ->withSession(['active_shop_id' => $this->shop->id])
            ->get("{$base}/{$this->owner->code_user}/depots/{$this->depot->id}")
            ->assertOk()
            ->assertInertia(function ($page) use (&$urls) {
                foreach ($page->toArray()['props']['products']['links'] as $link) {
                    if ($link['url']) {
                        $urls[] = $link['url'];
                    }
                }
            });

        $this->assertNotEmpty($urls, 'Aucun lien de pagination à vérifier.');

        return $urls;
    }

    /**
     * ValidateAccountAccess injectait `account_owner` (un modèle Eloquent !) et
     * `account_code` via `$request->merge()`, qui sur une requête GET écrit dans le sac
     * de la query string. `withQueryString()` les recollait dans chaque lien, d'où des
     * URLs du type `?account_owner[incrementing]=1&account_owner[exists]=1&...`.
     */
    public function test_pagination_links_do_not_leak_request_attributes(): void
    {
        foreach ($this->paginationUrls() as $url) {
            $this->assertStringNotContainsString('account_owner', $url);
            $this->assertStringNotContainsString('account_code', $url);
        }
    }

    /**
     * Le paginateur bâtit ses liens sur `$request->url()`, insensible à
     * `URL::forceScheme('https')`. En production les liens sortaient donc en `http://`
     * sur une page servie en `https://`, et la CSP `connect-src 'self'` bloquait la
     * visite Inertia.
     */
    public function test_pagination_links_follow_the_forced_scheme(): void
    {
        // Reproduire la production : PHP reçoit la requête en clair (le nginx du
        // conteneur ne transmet aucun schéma) alors que la génération force `https`.
        // Sans l'URL absolue, la requête de test naît de l'APP_URL de phpunit, déjà en
        // `https`, et le test passerait quoi qu'il arrive.
        URL::forceScheme('https');

        foreach ($this->paginationUrls('http://localhost') as $url) {
            $this->assertStringStartsWith('https://', $url);
        }
    }
}
