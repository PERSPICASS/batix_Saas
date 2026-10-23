<?php

namespace Tests\Feature\Product;

use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** La liste des produits se trie par nom (par défaut, sans tenir compte des majuscules), date, prix ou stock. */
class ProductIndexSortTest extends TestCase
{
    use RefreshDatabase;

    private function names(string $sort = ''): array
    {
        $shop = Shop::factory()->create();
        $owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $owner->id]);
        $this->subscribeOwnerOf($shop);

        // Chaque tri donne un ordre différent des autres : un tri ignoré ne passerait pas.
        $products = [
            ['Brouette', 25000, 4],
            ['Vis 6mm', 50, 900],
            ['agrafes', 1500, 0],
            ['ciment 50kg', 6000, 120],
        ];

        foreach ($products as $i => [$name, $price, $stock]) {
            Product::factory()->create([
                'shop_id' => $shop->id, 'name' => $name, 'is_active' => true, 'created_at' => now()->addMinutes($i),
                'selling_price' => $price, 'stock_quantity' => $stock,
            ]);
        }

        $names = [];
        $this->actingAs($owner)->withSession(['active_shop_id' => $shop->id])
            ->get("/{$owner->code_user}/produits" . ($sort ? "?sort={$sort}" : ''))
            ->assertOk()
            ->assertInertia(function ($page) use (&$names) {
                $names = array_column($page->toArray()['props']['products']['data'], 'name');
            });

        return $names;
    }

    public function test_by_name_by_default(): void
    {
        $this->assertSame(['agrafes', 'Brouette', 'ciment 50kg', 'Vis 6mm'], $this->names());
    }

    public function test_newest_first(): void
    {
        $this->assertSame(['ciment 50kg', 'agrafes', 'Vis 6mm', 'Brouette'], $this->names('newest'));
    }

    public function test_by_name_ascending(): void
    {
        $this->assertSame(['agrafes', 'Brouette', 'ciment 50kg', 'Vis 6mm'], $this->names('name_asc'));
    }

    public function test_by_name_descending(): void
    {
        $this->assertSame(['Vis 6mm', 'ciment 50kg', 'Brouette', 'agrafes'], $this->names('name_desc'));
    }

    public function test_by_price(): void
    {
        $this->assertSame(['Vis 6mm', 'agrafes', 'ciment 50kg', 'Brouette'], $this->names('price_asc'));
    }

    public function test_by_price_descending(): void
    {
        $this->assertSame(['Brouette', 'ciment 50kg', 'agrafes', 'Vis 6mm'], $this->names('price_desc'));
    }

    public function test_by_stock(): void
    {
        $this->assertSame(['agrafes', 'Brouette', 'ciment 50kg', 'Vis 6mm'], $this->names('stock_asc'));
    }

    public function test_by_stock_descending(): void
    {
        $this->assertSame(['Vis 6mm', 'ciment 50kg', 'Brouette', 'agrafes'], $this->names('stock_desc'));
    }

    public function test_an_unknown_sort_falls_back_to_name(): void
    {
        $this->assertSame(['agrafes', 'Brouette', 'ciment 50kg', 'Vis 6mm'], $this->names('id;drop_asc'));
    }

    /**
     * Sans paramètre, `filters` partait en `[]` : côté JS, `filters.sort` y vaut la méthode
     * Array.prototype.sort, que useState appelait — la page restait blanche.
     */
    public function test_empty_filters_reach_the_page_as_an_object(): void
    {
        $shop = Shop::factory()->create();
        $owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $owner->id]);
        $this->subscribeOwnerOf($shop);

        $version = app(\App\Http\Middleware\HandleInertiaRequests::class)->version(request());
        $json = $this->actingAs($owner)
            ->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => (string) $version])
            ->get("/{$owner->code_user}/produits")
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('"filters":{}', $json);
    }
}
