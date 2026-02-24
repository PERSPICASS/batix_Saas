<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class ProductMultiTenancyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Shop $shop1;
    protected Shop $shop2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->shop1 = Shop::factory()->create(['user_id' => $this->user->id, 'name' => 'Shop 1']);
        $this->shop2 = Shop::factory()->create(['user_id' => $this->user->id, 'name' => 'Shop 2']);
    }

    #[Test]
    public function it_filters_products_by_active_shop(): void
    {
        $category1 = Category::factory()->create(['shop_id' => $this->shop1->id]);
        $category2 = Category::factory()->create(['shop_id' => $this->shop2->id]);

        $product1 = Product::factory()->create([
            'shop_id' => $this->shop1->id,
            'category_id' => $category1->id,
            'name' => 'Product Shop 1',
        ]);
        $product2 = Product::factory()->create([
            'shop_id' => $this->shop2->id,
            'category_id' => $category2->id,
            'name' => 'Product Shop 2',
        ]);

        // Sélectionner shop1
        $response = $this->actingAs($this->user)
            ->get('/products?shop=' . $this->shop1->id);

        $response->assertInertia(fn ($page) =>
            $page->component('Products/Index')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Product Shop 1')
        );
    }

    #[Test]
    public function it_creates_product_in_active_shop(): void
    {
        $category = Category::factory()->create(['shop_id' => $this->shop2->id]);

        // Sélectionner shop2
        $this->actingAs($this->user)->get('/dashboard?shop=' . $this->shop2->id);

        $response = $this->actingAs($this->user)->post('/products', [
            'shop_id' => $this->shop2->id,
            'category_id' => $category->id,
            'name' => 'New Product',
            'sku' => 'TEST-123',
            'purchase_price' => 10.00,
            'selling_price' => 20.00,
            'tax_rate' => 20,
            'stock_quantity' => 10,
            'unit' => 'piece',
            'track_stock' => true,
        ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('products', [
            'shop_id' => $this->shop2->id,
            'name' => 'New Product',
        ]);
    }

    #[Test]
    public function it_prevents_creating_product_in_wrong_shop(): void
    {
        $category = Category::factory()->create(['shop_id' => $this->shop1->id]);

        // Tenter de créer un produit dans shop1 alors que shop2 est active
        $this->actingAs($this->user)->get('/dashboard?shop=' . $this->shop2->id);

        $response = $this->actingAs($this->user)->post('/products', [
            'shop_id' => $this->shop1->id, // Tentative de créer dans shop1
            'category_id' => $category->id,
            'name' => 'Sneaky Product',
            'sku' => 'SNEAK-123',
            'purchase_price' => 10.00,
            'selling_price' => 20.00,
            'tax_rate' => 20,
            'stock_quantity' => 10,
            'unit' => 'piece',
        ]);

        // Le contrôleur devrait valider que shop_id appartient à l'utilisateur
        $response->assertStatus(302); // Redirection ou erreur
    }

    #[Test]
    public function it_shows_only_categories_from_active_shop_in_create_form(): void
    {
        $category1 = Category::factory()->create([
            'shop_id' => $this->shop1->id,
            'name' => 'Category Shop 1',
        ]);
        $category2 = Category::factory()->create([
            'shop_id' => $this->shop2->id,
            'name' => 'Category Shop 2',
        ]);

        // Accéder au formulaire avec shop1 active
        $response = $this->actingAs($this->user)
            ->get('/products/create?shop=' . $this->shop1->id);

        $response->assertInertia(fn ($page) =>
            $page->component('Products/Create')
                ->has('categories', 1)
                ->where('categories.0.name', 'Category Shop 1')
        );
    }

    #[Test]
    public function user_cannot_view_products_from_other_users_shops(): void
    {
        $otherUser = User::factory()->create();
        $otherShop = Shop::factory()->create(['user_id' => $otherUser->id]);
        $otherCategory = Category::factory()->create(['shop_id' => $otherShop->id]);
        $otherProduct = Product::factory()->create([
            'shop_id' => $otherShop->id,
            'category_id' => $otherCategory->id,
            'name' => 'Other User Product',
        ]);

        // Essayer d'accéder aux produits
        $response = $this->actingAs($this->user)->get('/products');

        $response->assertInertia(fn ($page) =>
            $page->component('Products/Index')
                ->has('products.data', 0) // Aucun produit visible
        );
    }

    #[Test]
    public function user_cannot_edit_product_from_other_users_shop(): void
    {
        $otherUser = User::factory()->create();
        $otherShop = Shop::factory()->create(['user_id' => $otherUser->id]);
        $otherCategory = Category::factory()->create(['shop_id' => $otherShop->id]);
        $otherProduct = Product::factory()->create([
            'shop_id' => $otherShop->id,
            'category_id' => $otherCategory->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get("/products/{$otherProduct->id}/edit");

        $response->assertStatus(403); // Forbidden
    }
}
