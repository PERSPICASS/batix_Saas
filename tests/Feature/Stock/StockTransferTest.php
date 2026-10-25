<?php

namespace Tests\Feature\Stock;

use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\StockTransfer;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Moving stock between the shops of one account: sent, in transit, then received. */
class StockTransferTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $cocody;
    private Shop $yopougon;
    private Product $cement;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cocody = Shop::factory()->create(['name' => 'Cocody']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->cocody->id]);
        $this->cocody->update(['user_id' => $this->owner->id]);
        $this->yopougon = Shop::factory()->create(['name' => 'Yopougon', 'user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->cocody);

        $this->cement = $this->product($this->cocody, ['stock_quantity' => 50, 'average_cost' => 700]);
    }

    private function product(Shop $shop, array $attrs = []): Product
    {
        return Product::factory()->create(array_merge([
            'shop_id' => $shop->id, 'name' => 'Ciment CPJ 45', 'brand' => 'SOCOCIM', 'sku' => 'CIM-45',
            'track_stock' => true, 'has_variations' => false, 'stock_quantity' => 0, 'min_stock_alert' => 10,
            'purchase_price' => 650, 'average_cost' => 650,
        ], $attrs));
    }

    private function send(array $lines, ?Shop $from = null, ?Shop $to = null, ?User $as = null)
    {
        return $this->actingAs($as ?? $this->owner)->post("/{$this->owner->code_user}/transferts-stock", [
            'transfers' => [[
                'from_shop_id' => ($from ?? $this->cocody)->id,
                'to_shop_id' => ($to ?? $this->yopougon)->id,
                'items' => collect($lines)->map(fn ($qty, $id) => ['product_id' => $id, 'quantity' => $qty])->values()->all(),
            ]],
        ]);
    }

    private function manager(Shop $shop): User
    {
        $manager = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);
        UserPermission::create(['user_id' => $manager->id, 'module' => 'stocks', 'can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => false]);

        return $manager;
    }

    public function test_sending_takes_the_stock_out_and_creates_the_product_at_the_destination(): void
    {
        $this->send([$this->cement->id => 20])->assertSessionHasNoErrors();

        $transfer = StockTransfer::sole();
        $this->assertSame('in_transit', $transfer->status);
        $this->assertStringStartsWith('TRS-', $transfer->reference);
        $this->assertSame(30, $this->cement->fresh()->stock_quantity);

        // Yopougon did not have it: created like a catalogue copy, with nothing in stock yet.
        $copy = Product::where('shop_id', $this->yopougon->id)->sole();
        $this->assertSame('CIM-45', $copy->sku);
        $this->assertSame(0, $copy->stock_quantity);
        $this->assertSame(-20, StockMovement::where('reference_type', 'StockTransfer')->sole()->quantity);
    }

    public function test_the_receiving_shop_takes_it_in_at_the_sending_cost(): void
    {
        // Yopougon holds 10 at 500; 10 arrive at Cocody's 700 → average 600.
        $theirs = $this->product($this->yopougon, ['stock_quantity' => 10, 'average_cost' => 500]);
        $this->send([$this->cement->id => 10]);
        $transfer = StockTransfer::sole();
        $this->assertSame($theirs->id, $transfer->items()->sole()->target_product_id);

        // Received by Yopougon's manager, the one who sees the goods arrive.
        $this->actingAs($this->manager($this->yopougon))
            ->post("/{$this->owner->code_user}/transferts-stock/{$transfer->id}/receptionner")
            ->assertSessionHasNoErrors();

        $this->assertSame('received', $transfer->fresh()->status);
        $this->assertSame(20, $theirs->fresh()->stock_quantity);
        $this->assertEquals(600, (float) $theirs->fresh()->average_cost);
    }

    public function test_cancelling_brings_the_stock_back_and_cannot_be_received_after(): void
    {
        $this->send([$this->cement->id => 20]);
        $transfer = StockTransfer::sole();

        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/transferts-stock/{$transfer->id}/annuler")->assertSessionHasNoErrors();

        $this->assertSame('cancelled', $transfer->fresh()->status);
        $this->assertSame(50, $this->cement->fresh()->stock_quantity);

        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/transferts-stock/{$transfer->id}/receptionner")
            ->assertSessionHasErrors('transfer');
        $this->assertSame(0, Product::where('shop_id', $this->yopougon->id)->sole()->stock_quantity);
    }

    public function test_a_transfer_is_received_once(): void
    {
        $this->send([$this->cement->id => 5]);
        $transfer = StockTransfer::sole();
        $url = "/{$this->owner->code_user}/transferts-stock/{$transfer->id}/receptionner";

        $this->actingAs($this->owner)->post($url)->assertSessionHasNoErrors();
        $this->actingAs($this->owner)->post($url)->assertSessionHasErrors('transfer');

        $this->assertSame(5, Product::where('shop_id', $this->yopougon->id)->sole()->stock_quantity);
    }

    public function test_sending_more_than_the_stock_is_refused_and_changes_nothing(): void
    {
        $this->send([$this->cement->id => 51])->assertSessionHasErrors('items');

        $this->assertSame(50, $this->cement->fresh()->stock_quantity);
        $this->assertSame(0, StockTransfer::count());
    }

    public function test_only_the_receiving_shop_receives(): void
    {
        $this->send([$this->cement->id => 5]);
        $transfer = StockTransfer::sole();

        // Cocody's manager sent nothing to himself: receiving is Yopougon's job.
        $this->actingAs($this->manager($this->cocody))
            ->post("/{$this->owner->code_user}/transferts-stock/{$transfer->id}/receptionner")
            ->assertForbidden();
    }

    public function test_nothing_moves_to_a_shop_of_another_account(): void
    {
        $stranger = Shop::factory()->create();

        $this->send([$this->cement->id => 5], to: $stranger)->assertForbidden();
        $this->assertSame(50, $this->cement->fresh()->stock_quantity);
    }

    public function test_suggestions_top_up_a_low_shop_from_one_with_plenty(): void
    {
        // Yopougon: 2 left, threshold 10. Cocody: 50, threshold 10.
        $low = $this->product($this->yopougon, ['stock_quantity' => 2]);

        $suggestions = $this->actingAs($this->owner)->get("/{$this->owner->code_user}/transferts-stock")
            ->assertOk()->viewData('page')['props']['suggestions'];

        // Up to 2 × 10 = 20 at Yopougon (need 18), Cocody keeps 2 × 10 (can spare 30).
        $this->assertCount(1, $suggestions);
        $this->assertSame($this->cement->id, $suggestions[0]['from_product_id']);
        $this->assertSame($low->id, $suggestions[0]['to_product_id']);
        $this->assertSame(18, $suggestions[0]['quantity']);
    }

    public function test_what_is_already_on_its_way_is_not_suggested_again(): void
    {
        $low = $this->product($this->yopougon, ['stock_quantity' => 2]);
        $this->send([$this->cement->id => 5]);

        $suggestions = $this->actingAs($this->owner)->get("/{$this->owner->code_user}/transferts-stock")
            ->viewData('page')['props']['suggestions'];

        // 18 needed, 5 already in transit.
        $this->assertSame(13, $suggestions[0]['quantity']);
    }

    public function test_several_suggestions_are_sent_as_one_transfer_per_pair_of_shops(): void
    {
        $sand = $this->product($this->cocody, ['name' => 'Sable', 'sku' => 'SAB', 'stock_quantity' => 40]);
        $plateau = Shop::factory()->create(['name' => 'Plateau', 'user_id' => $this->owner->id]);

        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/transferts-stock", ['transfers' => [
            ['from_shop_id' => $this->cocody->id, 'to_shop_id' => $this->yopougon->id, 'items' => [
                ['product_id' => $this->cement->id, 'quantity' => 5], ['product_id' => $sand->id, 'quantity' => 4],
            ]],
            ['from_shop_id' => $this->cocody->id, 'to_shop_id' => $plateau->id, 'items' => [['product_id' => $this->cement->id, 'quantity' => 3]]],
        ]])->assertSessionHasNoErrors();

        $this->assertSame(2, StockTransfer::count());
        $this->assertSame(42, $this->cement->fresh()->stock_quantity);
        $this->assertSame(2, StockTransfer::where('to_shop_id', $this->yopougon->id)->sole()->items()->count());
    }
}
