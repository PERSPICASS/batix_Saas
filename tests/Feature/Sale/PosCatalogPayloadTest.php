<?php

namespace Tests\Feature\Sale;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * La caisse embarque tout le catalogue (recherche locale + cache hors ligne).
 * En modèles complets, c'était ~1 Ko par produit : 3 Mo de HTML pour 3 000
 * produits, à chaque ouverture, souvent sur réseau mobile. Seules les colonnes
 * lues par Sales/Create.tsx doivent partir.
 */
class PosCatalogPayloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_pos_only_ships_the_fields_it_reads(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $owner->id]);
        $owner->update(['shop_id' => $shop->id]);

        $parent = Product::factory()->create(['shop_id' => $shop->id, 'has_variations' => true]);
        Product::factory()->create(['shop_id' => $shop->id, 'parent_id' => $parent->id]);
        Customer::factory()->create(['shop_id' => $shop->id]);

        $expected = ['id', 'parent_id', 'name', 'sku', 'image', 'selling_price', 'tax_rate', 'stock_quantity', 'unit', 'has_variations'];

        $this->actingAs($owner->fresh())->get('/'.$owner->accountCode().'/ventes/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('products', 1)
                ->where('products.0', fn ($p) => collect($p)->keys()->diff([...$expected, 'variations'])->isEmpty())
                ->has('products.0.variations', 1)
                ->where('products.0.variations.0', fn ($v) => collect($v)->keys()->diff($expected)->isEmpty())
                ->where('customers.0', fn ($c) => collect($c)->keys()->sort()->values()->all() === ['credit_balance', 'id', 'name'])
            );
    }
}
