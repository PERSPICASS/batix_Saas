<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class ShopSwitcherTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Shop $shop1;
    protected Shop $shop2;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer un utilisateur avec 2 boutiques
        $this->user = User::factory()->create();
        $this->shop1 = Shop::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Boutique A',
            'slug' => 'boutique-a',
        ]);
        $this->shop2 = Shop::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Boutique B',
            'slug' => 'boutique-b',
        ]);
    }

    #[Test]
    public function it_initializes_active_shop_on_first_request(): void
    {
        $response = $this->actingAs($this->user)->get('/dashboard');

        $response->assertStatus(200);
        $this->assertEquals($this->shop1->id, session('active_shop_id'));
    }

    #[Test]
    public function it_sets_active_shop_from_url_parameter(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/dashboard?shop=' . $this->shop2->id);

        $response->assertStatus(200);
        $this->assertEquals($this->shop2->id, session('active_shop_id'));
    }

    #[Test]
    public function it_persists_active_shop_across_requests(): void
    {
        // Première requête : sélectionner shop2
        $this->actingAs($this->user)->get('/dashboard?shop=' . $this->shop2->id);
        $this->assertEquals($this->shop2->id, session('active_shop_id'));

        // Deuxième requête : sans paramètre shop
        $this->actingAs($this->user)->get('/products');
        $this->assertEquals($this->shop2->id, session('active_shop_id'));
    }

    #[Test]
    public function it_prevents_accessing_other_users_shop(): void
    {
        $otherUser = User::factory()->create();
        $otherShop = Shop::factory()->create([
            'user_id' => $otherUser->id,
            'name' => 'Other Shop',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/dashboard?shop=' . $otherShop->id);

        // La boutique ne doit pas être définie car l'utilisateur n'y a pas accès
        $this->assertNotEquals($otherShop->id, session('active_shop_id'));
    }

    #[Test]
    public function it_shares_active_shop_with_inertia(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/dashboard?shop=' . $this->shop2->id);

        $response->assertInertia(fn ($page) => 
            $page->has('activeShop')
                ->where('activeShop.id', $this->shop2->id)
                ->where('activeShop.name', 'Boutique B')
        );
    }

    #[Test]
    public function it_switches_shop_and_redirects_properly(): void
    {
        // Définir shop1 comme active
        $this->actingAs($this->user)->get('/dashboard?shop=' . $this->shop1->id);
        $this->assertEquals($this->shop1->id, session('active_shop_id'));

        // Changer pour shop2
        $response = $this->actingAs($this->user)->get('/products?shop=' . $this->shop2->id);
        
        $this->assertEquals($this->shop2->id, session('active_shop_id'));
        $response->assertStatus(200);
    }

    #[Test]
    public function helper_get_active_shop_returns_correct_shop(): void
    {
        $this->actingAs($this->user)->get('/dashboard?shop=' . $this->shop2->id);

        $activeShop = get_active_shop();
        
        $this->assertNotNull($activeShop);
        $this->assertEquals($this->shop2->id, $activeShop->id);
        $this->assertEquals('Boutique B', $activeShop->name);
    }

    #[Test]
    public function helper_get_active_shop_id_returns_correct_id(): void
    {
        $this->actingAs($this->user)->get('/dashboard?shop=' . $this->shop2->id);

        $activeShopId = get_active_shop_id();
        
        $this->assertEquals($this->shop2->id, $activeShopId);
    }

    #[Test]
    public function user_with_single_shop_has_auto_selection(): void
    {
        // Créer un utilisateur avec une seule boutique
        $singleShopUser = User::factory()->create();
        $singleShop = Shop::factory()->create([
            'user_id' => $singleShopUser->id,
        ]);

        $response = $this->actingAs($singleShopUser)->get('/dashboard');

        $this->assertEquals($singleShop->id, session('active_shop_id'));
    }
}
