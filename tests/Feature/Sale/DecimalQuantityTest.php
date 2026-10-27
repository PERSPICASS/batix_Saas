<?php

namespace Tests\Feature\Sale;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\User;
use App\Rules\QuantityForProduct;
use App\Support\Unit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * 1,5 m de ruban, 2,5 kg de ciment : une quincaillerie vend au mètre et au kilo.
 *
 * Toute la chaîne était en entiers et PHP tronquait en silence (un paramètre `int`
 * reçoit 2,5 et garde 2) : vendre 2,5 kg n'en retirait que 2 du stock. Seules les unités
 * divisibles acceptent une décimale — 0,5 marteau reste une faute de frappe.
 */
class DecimalQuantityTest extends TestCase
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
    }

    private function product(string $unit, float $stock = 10): Product
    {
        return Product::factory()->create([
            'shop_id' => $this->shop->id,
            'unit' => $unit,
            'stock_quantity' => $stock,
            'track_stock' => true,
            'tax_rate' => 0,
            'selling_price' => 1000,
        ]);
    }

    private function sell(array $items)
    {
        return $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", [
            'shop_id' => $this->shop->id,
            'payment_method' => 'cash',
            'amount_paid' => 100000,
            'items' => $items,
        ]);
    }

    public function test_selling_two_and_a_half_kilos_takes_two_and_a_half_out(): void
    {
        $cement = $this->product('kg');

        $this->sell([['product_id' => $cement->id, 'quantity' => 2.5, 'unit_price' => 1000]])
            ->assertSessionHasNoErrors();

        $this->assertSame(7.5, $cement->fresh()->stock_quantity);
        $this->assertSame(-2.5, StockMovement::where('product_id', $cement->id)->sole()->quantity);
        $this->assertEquals(2500, (float) Sale::sole()->subtotal);
        $this->assertSame(2.5, Sale::sole()->items()->sole()->quantity);
    }

    public function test_a_quantity_sent_as_text_is_accepted(): void
    {
        $ribbon = $this->product('m');

        $this->sell([['product_id' => $ribbon->id, 'quantity' => '1.5', 'unit_price' => 1000]])
            ->assertSessionHasNoErrors();

        $this->assertSame(8.5, $ribbon->fresh()->stock_quantity);
    }

    public function test_half_a_hammer_is_refused(): void
    {
        $hammer = $this->product('piece');

        $this->sell([['product_id' => $hammer->id, 'quantity' => 1.5, 'unit_price' => 1000]])
            ->assertSessionHasErrors('items.0.quantity');

        $this->assertSame(10.0, $hammer->fresh()->stock_quantity);
        $this->assertSame(0, Sale::count());
    }

    public function test_more_than_three_decimals_is_refused(): void
    {
        $cement = $this->product('kg');

        $this->sell([['product_id' => $cement->id, 'quantity' => 1.2345, 'unit_price' => 1000]])
            ->assertSessionHasErrors('items.0.quantity');
    }

    public function test_lines_adding_up_to_exactly_the_stock_are_not_refused_for_float_noise(): void
    {
        // 0.1 + 0.2 vaut 0.30000000000000004 en flottant : sans arrondi, la somme
        // dépassait un stock de 0,3 et la vente était refusée pour « stock insuffisant ».
        $wire = $this->product('m', 0.3);

        $this->sell([
            ['product_id' => $wire->id, 'quantity' => 0.1, 'unit_price' => 1000],
            ['product_id' => $wire->id, 'quantity' => 0.2, 'unit_price' => 1000],
        ])->assertSessionHasNoErrors();

        $this->assertSame(0.0, $wire->fresh()->stock_quantity);
    }

    public function test_partial_returns_that_add_up_mark_the_line_returned(): void
    {
        $cement = $this->product('kg');
        $this->sell([['product_id' => $cement->id, 'quantity' => 0.9, 'unit_price' => 1000]]);
        $sale = Sale::sole();
        $item = $sale->items()->sole();

        $return = fn (float $quantity) => $this->actingAs($this->owner)->postJson("/{$this->owner->code_user}/ventes/{$sale->id}/retours", [
            'sale_item_id' => $item->id,
            'quantity_returned' => $quantity,
            'refund_method' => 'cash',
            'reason' => 'not_satisfied',
        ]);

        $return(0.7)->assertOk();
        $this->assertFalse((bool) $item->fresh()->is_returned);

        // 0.7 + 0.2 = 0.8999999999999999 : sans arrondi la ligne ne passait jamais « retournée ».
        $return(0.2)->assertOk();
        $this->assertTrue((bool) $item->fresh()->is_returned);
        $this->assertSame('returned', $sale->fresh()->status);

        $return(0.001)->assertSessionHasErrors('quantity_returned');
    }

    public function test_a_fractional_entry_is_weighted_into_the_average_cost(): void
    {
        $cement = $this->product('kg');
        $cement->forceFill(['average_cost' => 100])->save();

        $cement->foldIntoAverageCost(12.5, 200);

        // (10 × 100 + 12,5 × 200) / 22,5 — un paramètre int aurait pesé 12 kg, pas 12,5.
        $this->assertEquals(155.56, (float) $cement->fresh()->average_cost);
    }

    public function test_free_text_units_are_brought_back_to_their_code(): void
    {
        $this->assertSame('kg', $this->product('Kg')->unit);
        $this->assertSame('m2', $this->product('M²')->unit);
        $this->assertSame('piece', $this->product('Pièce')->unit);
        $this->assertSame('bag', $this->product('Sac')->unit);
        $this->assertSame('Rouleau', $this->product('Rouleau')->unit, 'Une unité inconnue est gardée telle quelle.');

        $this->assertTrue(Unit::isDivisible('Kg'));
        $this->assertFalse(Unit::isDivisible('Sac'));
        $this->assertFalse(Unit::isDivisible('Rouleau'));
    }

    public function test_the_stock_typed_on_the_product_form_follows_its_unit(): void
    {
        $check = fn (?string $unit, mixed $stock) => Validator::make(
            ['stock_quantity' => $stock],
            ['stock_quantity' => ['nullable', 'numeric', 'min:0', QuantityForProduct::forUnit($unit)]],
        )->passes();

        $this->assertTrue($check('kg', 2.5));
        $this->assertFalse($check('piece', 2.5));
        $this->assertFalse($check(null, 2.5), 'Sans unité, un produit se vend à la pièce.');
        $this->assertTrue($check('piece', 3));
    }

    public function test_quantities_are_written_the_french_way(): void
    {
        $this->assertSame('2,5 kg', Unit::format(2.5, 'kg'));
        $this->assertSame('12', Unit::format(12, 'piece'));
        $this->assertSame('1 234,125 m', Unit::format(1234.125, 'm'));
        $this->assertSame('3 m²', Unit::format('3.000', 'M²'));
        $this->assertSame('Sac', Unit::label('sac'));
        $this->assertSame('kg', Unit::label('Kg'));
    }

    public function test_the_ticket_prints_the_kept_quantity_with_its_unit(): void
    {
        $cement = $this->product('kg');
        $this->sell([['product_id' => $cement->id, 'quantity' => 2.5, 'unit_price' => 1000]]);

        app()->setLocale('fr');
        $html = view('pdf.ticket', [
            'sale' => Sale::sole()->load(['items.returns', 'items.product:id,unit', 'shop', 'customer', 'user']),
            'logo' => null,
            'shop' => $this->shop,
            'currencySymbol' => 'F',
        ])->render();

        $this->assertStringContainsString('2,5 kg ×', $html);
    }
}
