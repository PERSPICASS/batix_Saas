<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class ShopPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $otherUser;
    protected Shop $userShop;
    protected Shop $otherUserShop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();

        $this->userShop = Shop::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'My Shop',
        ]);

        $this->otherUserShop = Shop::factory()->create([
            'user_id' => $this->otherUser->id,
            'name' => 'Other Shop',
        ]);
    }

    #[Test]
    public function user_can_view_own_shop(): void
    {
        $this->assertTrue($this->user->can('view', $this->userShop));
    }

    #[Test]
    public function user_cannot_view_other_users_shop(): void
    {
        $this->assertFalse($this->user->can('view', $this->otherUserShop));
    }

    #[Test]
    public function user_can_update_own_shop(): void
    {
        $this->assertTrue($this->user->can('update', $this->userShop));
    }

    #[Test]
    public function user_cannot_update_other_users_shop(): void
    {
        $this->assertFalse($this->user->can('update', $this->otherUserShop));
    }

    #[Test]
    public function user_can_delete_own_shop(): void
    {
        $this->assertTrue($this->user->can('delete', $this->userShop));
    }

    #[Test]
    public function user_cannot_delete_other_users_shop(): void
    {
        $this->assertFalse($this->user->can('delete', $this->otherUserShop));
    }

    #[Test]
    public function shop_show_page_requires_authorization(): void
    {
        // Accès à sa propre boutique
        $response = $this->actingAs($this->user)
            ->get("/shops/{$this->userShop->id}");
        $response->assertStatus(200);

        // Tentative d'accès à la boutique d'un autre utilisateur
        $response = $this->actingAs($this->user)
            ->get("/shops/{$this->otherUserShop->id}");
        $response->assertStatus(403);
    }

    #[Test]
    public function shop_edit_page_requires_authorization(): void
    {
        // Édition de sa propre boutique
        $response = $this->actingAs($this->user)
            ->get("/shops/{$this->userShop->id}/edit");
        $response->assertStatus(200);

        // Tentative d'édition de la boutique d'un autre utilisateur
        $response = $this->actingAs($this->user)
            ->get("/shops/{$this->otherUserShop->id}/edit");
        $response->assertStatus(403);
    }

    #[Test]
    public function shop_update_requires_authorization(): void
    {
        // Mise à jour de sa propre boutique
        $response = $this->actingAs($this->user)->put("/shops/{$this->userShop->id}", [
            'name' => 'Updated Shop Name',
            'address' => '123 Main St',
            'city' => 'Paris',
            'postal_code' => '75001',
            'country' => 'France',
            'currency' => 'EUR',
        ]);
        $response->assertRedirect();
        $this->assertDatabaseHas('shops', [
            'id' => $this->userShop->id,
            'name' => 'Updated Shop Name',
        ]);

        // Tentative de mise à jour de la boutique d'un autre utilisateur
        $response = $this->actingAs($this->user)->put("/shops/{$this->otherUserShop->id}", [
            'name' => 'Hacked Shop',
        ]);
        $response->assertStatus(403);
        $this->assertDatabaseMissing('shops', [
            'id' => $this->otherUserShop->id,
            'name' => 'Hacked Shop',
        ]);
    }

    #[Test]
    public function shop_delete_requires_authorization(): void
    {
        // Suppression de sa propre boutique
        $shopToDelete = Shop::factory()->create(['user_id' => $this->user->id]);
        $response = $this->actingAs($this->user)->delete("/shops/{$shopToDelete->id}");
        $response->assertRedirect();
        $this->assertSoftDeleted('shops', ['id' => $shopToDelete->id]);

        // Tentative de suppression de la boutique d'un autre utilisateur
        $response = $this->actingAs($this->user)->delete("/shops/{$this->otherUserShop->id}");
        $response->assertStatus(403);
        $this->assertDatabaseHas('shops', [
            'id' => $this->otherUserShop->id,
            'deleted_at' => null,
        ]);
    }
}
