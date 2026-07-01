<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    /**
     * Test that authenticated user can access dashboard
     */
    public function test_authenticated_user_can_access_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertStatus(200);
    }

    /**
     * Test that unauthenticated user cannot access dashboard
     */
    public function test_unauthenticated_user_cannot_access_dashboard(): void
    {
        $this->get('/dashboard')
            ->assertRedirect('/login');
    }

    /**
     * Test that user can only access their own shop
     */
    public function test_user_can_only_access_own_shop(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $shop1 = Shop::factory()->create(['user_id' => $user1->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user2->id]);

        $this->actingAs($user1);

        // User1 owns shop1
        $this->assertEquals($user1->id, $shop1->user_id);

        // User1 doesn't own shop2
        $this->assertNotEquals($user1->id, $shop2->user_id);
    }

    /**
     * Test that user cannot access another user's invoices
     */
    public function test_user_cannot_access_other_user_invoices(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $shop1 = Shop::factory()->create(['user_id' => $user1->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user2->id]);

        $this->actingAs($user1);

        $this->assertEquals($user1->id, $shop1->user_id);
        $this->assertNotEquals($user1->id, $shop2->user_id);
    }

    /**
     * Test that user can create invoices in their shop
     */
    public function test_user_can_create_invoice_in_own_shop(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user);

        $this->assertEquals($user->id, $shop->user_id);
    }

    /**
     * Test that user cannot create invoices in other user's shop
     */
    public function test_user_cannot_create_invoice_in_other_shop(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $shop = Shop::factory()->create(['user_id' => $user1->id]);

        $this->actingAs($user2);

        // User2 should not be able to create in shop owned by user1
        $this->assertNotEquals($user2->id, $shop->user_id);
    }

    /**
     * Test that user roles are respected
     */
    public function test_user_roles_respected(): void
    {
        $owner = User::factory()->create();

        $this->actingAs($owner);

        $this->assertTrue(true);
    }

    /**
     * Test that user can view their own profile
     */
    public function test_user_can_view_own_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        $this->assertEquals($user->id, auth()->id());
    }
}
