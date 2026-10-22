<?php

namespace Tests\Feature\Product;

use App\Models\Product;
use App\Models\ProductArticle;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Les articles (numéros de série) suivent la boutique active, pas `users.shop_id` : un
 * propriétaire travaillant dans sa 2e boutique recevait un 404 sur chaque action.
 */
class ProductArticleShopScopeTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $main = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $main->id]);
        $main->update(['user_id' => $this->owner->id]);
        $this->branch = Shop::factory()->create(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($main);
    }

    private function inBranch()
    {
        return $this->actingAs($this->owner)->withSession(['active_shop_id' => $this->branch->id]);
    }

    private function url(string $path): string
    {
        return "/{$this->owner->code_user}/{$path}";
    }

    public function test_an_owner_manages_the_articles_of_their_second_shop(): void
    {
        $product = Product::factory()->create(['shop_id' => $this->branch->id]);

        $this->inBranch()->postJson($this->url('articles'), ['product_id' => $product->id, 'name' => 'SN-001'])
            ->assertCreated();
        $article = ProductArticle::where('product_id', $product->id)->firstOrFail();
        $this->assertSame($this->branch->id, $article->shop_id);

        $this->inBranch()->getJson($this->url("produits/{$product->id}/articles"))
            ->assertOk()->assertJsonCount(1, 'articles');
        $this->inBranch()->getJson($this->url("produits/{$product->id}/articles-disponibles"))
            ->assertOk()->assertJsonCount(1, 'articles');
        $this->inBranch()->patchJson($this->url("articles/{$article->id}/status"), ['status' => 'sold'])
            ->assertOk();
        $this->inBranch()->deleteJson($this->url("articles/{$article->id}"))
            ->assertOk();

        $this->assertDatabaseMissing('product_articles', ['id' => $article->id]);
    }

    public function test_another_accounts_product_stays_hidden(): void
    {
        $stranger = Product::factory()->create(['shop_id' => Shop::factory()->create()->id]);
        ProductArticle::create(['product_id' => $stranger->id, 'shop_id' => $stranger->shop_id, 'name' => 'X', 'status' => 'available']);

        $this->inBranch()->getJson($this->url("produits/{$stranger->id}/articles"))->assertNotFound();
        $this->inBranch()->postJson($this->url('articles'), ['product_id' => $stranger->id, 'name' => 'SN-002'])
            ->assertNotFound();
    }
}
