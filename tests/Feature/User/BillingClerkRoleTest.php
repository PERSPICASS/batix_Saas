<?php

namespace Tests\Feature\User;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Chargé de facturation : devis, factures et clients — ni caisse, ni stock, ni dépenses. */
class BillingClerkRoleTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    public function test_the_owner_creates_a_billing_clerk_with_billing_modules_only(): void
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/users", [
            'name' => 'Facturation', 'email' => 'factu@example.com', 'is_active' => true,
            'role' => 'billing_clerk', 'shop_id' => $this->shop->id,
        ])->assertSessionHasNoErrors();

        $user = User::where('email', 'factu@example.com')->firstOrFail();
        $this->assertSame('billing_clerk', $user->role);
        $this->assertTrue($user->hasPermission('invoices', 'create'));
        $this->assertTrue($user->hasPermission('quotes', 'edit'));
        $this->assertTrue($user->hasPermission('customers', 'create'));
        $this->assertTrue($user->hasPermission('products', 'view'));
        $this->assertFalse($user->hasPermission('products', 'edit'));
        $this->assertFalse($user->hasPermission('sales', 'view'));
        $this->assertFalse($user->hasPermission('stocks', 'view'));
        $this->assertFalse($user->hasPermission('expenses', 'view'));
    }

    public function test_a_billing_clerk_lands_on_the_invoices(): void
    {
        $user = User::factory()->create(['role' => 'billing_clerk', 'shop_id' => $this->shop->id]);

        $this->actingAs($user)->get("/{$this->owner->code_user}/dashboard")
            ->assertRedirect(route('invoices.index', ['code_user' => $this->owner->code_user]));
    }
}
