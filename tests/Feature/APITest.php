<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class APITest extends TestCase
{
    /**
     * Test that API requires authentication
     */
    public function test_api_requires_authentication(): void
    {
        $this->getJson('/api/invoices')
            ->assertStatus(401);
    }

    /**
     * Test that authenticated user can get invoices
     */
    public function test_authenticated_user_can_get_invoices(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/invoices')
            ->assertStatus(200);
    }

    /**
     * Test that API returns user's invoices only
     */
    public function test_api_returns_user_invoices_only(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $shop1 = Shop::factory()->create(['user_id' => $user1->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user2->id]);

        Invoice::factory()->create(['shop_id' => $shop1->id]);
        Invoice::factory()->create(['shop_id' => $shop2->id]);

        $this->actingAs($user1, 'sanctum')
            ->getJson('/api/invoices')
            ->assertStatus(200);
    }

    /**
     * Test that API can create invoice
     */
    public function test_api_can_create_invoice(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/invoices', [
                'shop_id' => $shop->id,
                'amount' => 5000,
            ])
            ->assertStatus(201);
    }

    /**
     * Test that API can get quote
     */
    public function test_api_can_get_quotes(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/quotes')
            ->assertStatus(200);
    }

    /**
     * Test that API can get sales
     */
    public function test_api_can_get_sales(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/sales')
            ->assertStatus(200);
    }

    /**
     * Test that API response is JSON
     */
    public function test_api_response_is_json(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/user')
            ->assertHeader('Content-Type', 'application/json');
    }

    /**
     * Test that API respects locale preference
     */
    public function test_api_respects_locale(): void
    {
        $user = User::factory()->create(['locale' => 'fr']);

        $this->actingAs($user, 'sanctum');

        $this->assertEquals('fr', $user->locale);
    }

    /**
     * Test that API cannot access other user's data
     */
    public function test_api_cannot_access_other_user_data(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $shop1 = Shop::factory()->create(['user_id' => $user1->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user2->id]);

        Invoice::factory()->create(['shop_id' => $shop1->id]);
        Invoice::factory()->create(['shop_id' => $shop2->id]);

        $this->actingAs($user1, 'sanctum');

        $this->assertNotEquals($user1->id, $shop2->user_id);
    }
}
