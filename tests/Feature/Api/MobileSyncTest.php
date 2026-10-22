<?php

namespace Tests\Feature\Api;

use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * La synchronisation mobile couvre toute la boutique, et par pages : elle ne renvoyait
 * que les ventes du propriétaire, et coupait à 100 sans curseur ni ordre — le reste
 * n'était jamais synchronisé.
 */
class MobileSyncTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
        Sanctum::actingAs($this->owner, ['sales:read']);
    }

    private function sale(array $attrs = []): Sale
    {
        static $n = 0;
        $n++;

        return Sale::create(array_merge([
            'shop_id' => $this->shop->id,
            'user_id' => $this->owner->id,
            'ticket_number' => sprintf('TKT-TEST%05d', $n),
            'subtotal' => 1000,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total' => 1000,
            'amount_paid' => 1000,
            'change_amount' => 0,
            'remaining_amount' => 0,
            'payment_method' => 'cash',
            'status' => 'completed',
            'sale_date' => now(),
        ], $attrs));
    }

    private function sync(array $params = [])
    {
        return $this->postJson('/api/sync/sales', array_merge(['shop_id' => $this->shop->id], $params));
    }

    public function test_a_cashiers_sales_are_synchronised(): void
    {
        $cashier = User::factory()->create(['role' => 'cashier', 'shop_id' => $this->shop->id]);
        $sale = $this->sale(['user_id' => $cashier->id]);

        $this->sync()->assertOk()->assertJsonPath('data.0.id', $sale->id);
    }

    public function test_more_than_a_page_is_reached_through_the_cursor(): void
    {
        // Même instant pour tous : l'ordre ne tient alors qu'à l'id, le cas où un
        // curseur sur updated_at seul perdrait des lignes.
        $this->travelTo(now()->subHour());
        $ids = collect(range(1, 150))->map(fn () => $this->sale()->id)->sort()->values();
        $this->travelBack();

        $since = now()->subDay()->toIso8601String();
        $first = $this->sync(['last_sync' => $since])->assertOk()
            ->assertJsonPath('has_more', true)
            ->assertJsonPath('timestamp', $since);
        $this->assertCount(100, $first->json('data'));

        $second = $this->sync(['last_sync' => $since, 'cursor' => $first->json('next_cursor')])->assertOk()
            ->assertJsonPath('has_more', false)
            ->assertJsonPath('next_cursor', null);
        $this->assertNotSame($since, $second->json('timestamp'));

        $seen = collect($first->json('data'))->merge($second->json('data'))->pluck('id')->sort()->values();
        $this->assertEquals($ids->all(), $seen->all());
    }

    public function test_another_accounts_shop_is_refused(): void
    {
        $this->postJson('/api/sync/sales', ['shop_id' => Shop::factory()->create()->id])->assertForbidden();
    }
}
