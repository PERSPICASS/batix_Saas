<?php

namespace Tests\Feature\Sale;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use App\Services\ShopReport;
use App\Services\ShopsOverview;
use App\Support\CounterSales;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Le CA au comptoir daté comme la comptabilité : une vente compte au jour de la vente pour
 * son montant d'origine, un retour en négatif au jour du retour. Un mois clos ne bouge plus.
 */
class DatedRevenueTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;
    private User $seller;
    private Product $drill;   // 10 000
    private Product $grinder; // 12 000

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
        $this->seller = User::factory()->create(['role' => 'manager', 'shop_id' => $this->shop->id]);

        $make = fn (string $name, int $price, int $cost) => Product::factory()->create([
            'shop_id' => $this->shop->id, 'name' => $name, 'selling_price' => $price, 'purchase_price' => $cost,
            'average_cost' => $cost, 'tax_rate' => 0, 'stock_quantity' => 20, 'track_stock' => true,
        ]);
        $this->drill = $make('Perceuse', 10000, 6000);
        $this->grinder = $make('Meuleuse', 12000, 7000);
    }

    private function url(string $path): string
    {
        return "/{$this->owner->code_user}/{$path}";
    }

    private function sell(Product $product, array $attrs = []): Sale
    {
        $this->actingAs($this->owner)->post($this->url('ventes'), array_merge([
            'shop_id' => $this->shop->id, 'payment_method' => 'cash', 'amount_paid' => 1000000,
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'unit_price' => (float) $product->selling_price]],
        ], $attrs))->assertSessionHasNoErrors();

        return Sale::latest('id')->firstOrFail();
    }

    private function returnItem(Sale $sale): void
    {
        $this->actingAs($this->owner)->postJson($this->url("ventes/{$sale->id}/retours"), [
            'sale_item_id' => $sale->items()->first()->id, 'quantity_returned' => 1, 'refund_method' => 'cash', 'reason' => 'not_satisfied',
        ])->assertOk();
    }

    private function month(string $month): array
    {
        $start = Carbon::parse("{$month}-01")->startOfMonth();

        return app(ShopsOverview::class)->figures(collect([$this->shop]), $start, $start->copy()->endOfMonth(), withSnapshot: false)[$this->shop->id];
    }

    public function test_a_return_next_month_leaves_the_closed_month_alone(): void
    {
        $this->travelTo(Carbon::parse('2026-10-15 10:00'));
        $sale = $this->sell($this->drill);
        $october = $this->month('2026-10');

        $this->travelTo(Carbon::parse('2026-11-05 10:00'));
        $this->returnItem($sale);

        // Octobre est tel qu'il a été clôturé, au franc près.
        $this->assertSame($october, $this->month('2026-10'));
        $this->assertSame(10000.0, $this->month('2026-10')['revenue']);
        $this->assertSame(1, $this->month('2026-10')['count'], 'La vente a bien eu lieu en octobre');
        $this->assertEquals(4000, $this->month('2026-10')['gross_margin']);

        // Le retour est en novembre : CA et marge négatifs, coût de l'article rendu repris.
        $this->assertSame(-10000.0, $this->month('2026-11')['revenue']);
        $this->assertEquals(-4000, $this->month('2026-11')['gross_margin']);
    }

    public function test_vat_and_discount_follow_the_return_exactly(): void
    {
        $this->drill->update(['tax_rate' => 18]);
        $this->travelTo(Carbon::parse('2026-10-15 10:00'));
        // 2 perceuses : 20 000 HT, remise 2 000, TVA 18 % sur 18 000 = 3 240 → 21 240.
        $sale = $this->sell($this->drill->fresh(), [
            'discount_amount' => 2000,
            'items' => [['product_id' => $this->drill->id, 'quantity' => 2, 'unit_price' => 10000]],
        ]);
        $this->assertSame('21240.00', $sale->original_total);

        $this->travelTo(Carbon::parse('2026-11-05 10:00'));
        $this->returnItem($sale); // une perceuse : 9 000 HT, 10 620 TTC

        $this->assertSame(21240.0, $this->month('2026-10')['revenue']);
        $this->assertSame(-10620.0, $this->month('2026-11')['revenue']);
        $this->assertSame(10620.0, (float) $sale->fresh()->total, 'Le ticket, lui, montre ce que le client garde');

        // HT : 18 000 en octobre, -9 000 en novembre ; coût 12 000 puis -6 000.
        $this->assertEquals(18000 - 12000, $this->month('2026-10')['gross_margin']);
        $this->assertEquals(-9000 + 6000, $this->month('2026-11')['gross_margin']);
    }

    public function test_an_exchange_next_month_shows_only_the_difference(): void
    {
        $this->travelTo(Carbon::parse('2026-10-15 10:00'));
        $sale = $this->sell($this->drill, ['amount_paid' => 10000]);

        $this->travelTo(Carbon::parse('2026-11-05 10:00'));
        $this->actingAs($this->owner)->post($this->url("ventes/{$sale->id}/echange"), [
            'shop_id' => $this->shop->id, 'payment_method' => 'cash', 'amount_paid' => 2000,
            'items' => [['product_id' => $this->grinder->id, 'quantity' => 1, 'unit_price' => 12000]],
            'lines' => [['sale_item_id' => $sale->items()->first()->id, 'quantity' => 1, 'reason' => 'wrong_item']],
        ])->assertSessionHasNoErrors();

        $this->assertSame(10000.0, $this->month('2026-10')['revenue']);
        $this->assertSame(2000.0, $this->month('2026-11')['revenue'], '12 000 vendus, 10 000 rendus');

        $november = collect(app(ShopReport::class)->paymentMethods([$this->shop->id], Carbon::parse('2026-11-01'), Carbon::parse('2026-11-30 23:59:59')))->keyBy('method');
        $this->assertSame(2000.0, $november['cash']['revenue'], 'Seuls 2 000 sont entrés en caisse en novembre');
        $this->assertSame(0.0, $november['store_credit']['revenue'] ?? 0.0);

        $products = app(ShopReport::class)->products([$this->shop->id], Carbon::parse('2026-11-01'), Carbon::parse('2026-11-30 23:59:59'))->keyBy('name');
        $this->assertEquals(-1, $products['Perceuse']['quantity']);
        $this->assertEquals(1, $products['Meuleuse']['quantity']);
    }

    public function test_a_return_counts_against_the_original_seller_and_customer(): void
    {
        $customer = Customer::factory()->create(['shop_id' => $this->shop->id]);
        $this->travelTo(Carbon::parse('2026-10-15 10:00'));
        $sale = $this->sell($this->drill, ['customer_id' => $customer->id]);
        // Vendue par le vendeur ; le retour sera saisi par le propriétaire.
        $sale->update(['user_id' => $this->seller->id]);

        $this->travelTo(Carbon::parse('2026-11-05 10:00'));
        $this->returnItem($sale); // saisi par le propriétaire

        $range = [Carbon::parse('2026-11-01'), Carbon::parse('2026-11-30 23:59:59')];
        $sellers = collect(app(ShopReport::class)->sellers([$this->shop->id], ...$range))->keyBy('name');
        $this->assertSame(-10000.0, $sellers[$this->seller->name]['revenue']);
        $this->assertArrayNotHasKey($this->owner->name, $sellers->all());

        $customers = collect(app(ShopReport::class)->customers([$this->shop->id], ...$range))->keyBy('id');
        $this->assertSame(-10000.0, $customers[$customer->id]['revenue']);
    }

    public function test_the_audit_finds_every_sale_adding_up_and_flags_one_that_does_not(): void
    {
        $sale = $this->sell($this->drill);
        $this->returnItem($sale);
        $this->sell($this->grinder);

        $this->artisan('sales:audit-revenue')->expectsOutputToContain('Chaque vente retombe sur son ticket')->assertSuccessful();

        DB::table('sales')->where('id', $sale->id)->update(['total' => 500]);
        $this->artisan('sales:audit-revenue')->expectsOutputToContain('ne retombent pas')->assertFailed();
    }

    public function test_the_backfill_rebuilds_original_amounts_of_existing_sales(): void
    {
        $this->drill->update(['tax_rate' => 18]);
        $sale = $this->sell($this->drill->fresh(), [
            'discount_amount' => 2000,
            'items' => [['product_id' => $this->drill->id, 'quantity' => 2, 'unit_price' => 10000]],
        ]);
        $this->returnItem($sale);
        $expected = [$sale->fresh()->original_total, $sale->fresh()->original_net, $sale->returns()->sole()->net_amount];

        // Une vente d'avant la migration : ni montant d'origine, ni part HT du retour, ni même
        // la remise d'origine (gardée seulement depuis peu) — `discount_amount` a été réduit
        // par le retour, de 2 000 à 1 000.
        DB::table('sales')->update(['original_total' => null, 'original_net' => null, 'original_discount_amount' => null]);
        DB::table('returns')->update(['net_amount' => null]);
        $this->assertSame('1000.00', $sale->fresh()->discount_amount);
        CounterSales::backfill();

        $this->assertSame($expected, [$sale->fresh()->original_total, $sale->fresh()->original_net, $sale->returns()->sole()->net_amount]);
        $this->assertSame(['21240.00', '18000.00', '9000.00'], $expected);
        $this->assertSame('2000.00', $sale->fresh()->original_discount_amount);
        $this->artisan('sales:audit-revenue')->assertSuccessful();
    }
}
