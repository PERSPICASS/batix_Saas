<?php

namespace Tests\Feature\Shop;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * One shop, one day, every screen: the dashboard, the analytics page and « Mes boutiques »
 * must give the same revenue, sales count and margin. They used to disagree: the dashboard
 * and the analytics counted completed sales only (no sale on credit, no invoice) and the
 * analytics took the margin on the last purchase price, ignoring discounts and returns.
 */
class FiguresConsistencyTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;
    private Product $hammer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create(['currency' => 'XOF']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        Shop::factory()->create(['user_id' => $this->owner->id]); // a second shop, so « Mes boutiques » applies
        $this->subscribeOwnerOf($this->shop);

        $this->hammer = Product::factory()->create([
            'shop_id' => $this->shop->id, 'stock_quantity' => 100, 'track_stock' => true, 'tax_rate' => 0,
            'selling_price' => 1000, 'purchase_price' => 500, 'average_cost' => 600,
        ]);

        $code = $this->owner->code_user;
        $sell = function (int $qty, array $attrs = []) use ($code) {
            $this->actingAs($this->owner)->post("/{$code}/ventes", array_merge([
                'shop_id' => $this->shop->id, 'payment_method' => 'cash', 'amount_paid' => $qty * 1000,
                'items' => [['product_id' => $this->hammer->id, 'quantity' => $qty, 'unit_price' => 1000]],
            ], $attrs))->assertSessionHasNoErrors();

            return Sale::latest('id')->firstOrFail();
        };

        $sell(3, ['discount_amount' => 300, 'amount_paid' => 2700]);           // 2 700, margin 2 700 - 1 800
        $sell(2, ['payment_method' => 'credit', 'amount_paid' => 500]);         // 2 000 on credit
        $cancelled = $sell(5);
        $this->actingAs($this->owner)->delete("/{$code}/ventes/{$cancelled->id}");

        $customer = Customer::factory()->create(['shop_id' => $this->shop->id]);
        $this->actingAs($this->owner)->post("/{$code}/factures", [
            'shop_id' => $this->shop->id, 'customer_id' => $customer->id, 'invoice_date' => now()->toDateString(), 'status' => 'sent',
            'items' => [['product_id' => $this->hammer->id, 'product_name' => 'Marteau', 'quantity' => 4, 'unit_price' => 1000]],
        ])->assertSessionHasNoErrors();
        $invoice = Invoice::sole();
        $this->actingAs($this->owner)->post("/{$code}/factures/{$invoice->id}/avoir", [
            'reason' => 'Retour', 'items' => [['invoice_item_id' => $invoice->items()->sole()->id, 'quantity' => 1]],
        ])->assertSessionHasNoErrors();
    }

    private function props(string $path, array $query = []): array
    {
        return $this->actingAs($this->owner)->withSession(['active_shop_id' => $this->shop->id])
            ->get("/{$this->owner->code_user}/{$path}?" . http_build_query($query))
            ->assertOk()->viewData('page')['props'];
    }

    public function test_every_screen_gives_the_same_figures(): void
    {
        // Revenue 2 700 + 2 000 + 4 000 - 1 000 = 7 700 ; 3 sales ;
        // margin (7 700) - cost (1 800 + 1 200 + 2 400 - 600 = 4 800) = 2 900.
        $overview = collect($this->props('mes-boutiques', ['period' => 'month'])['rows'])->firstWhere('id', $this->shop->id)['figures'];
        $this->assertEquals(7700, $overview['revenue']);
        $this->assertSame(3, $overview['count']);
        $this->assertEquals(2900, $overview['gross_margin']);

        $today = collect($this->props('mes-boutiques', ['period' => 'today'])['rows'])->firstWhere('id', $this->shop->id)['figures'];
        $dashboard = $this->props('dashboard', ['period' => 'week']);
        $this->assertEquals($today['revenue'], $dashboard['stats']['todaySales']);
        $this->assertEquals(7700, $dashboard['performanceData']['total']);

        $analytics = $this->props('analytics', ['period' => 'month', 'compare_mode' => 'year']);
        $this->assertEquals(7700, $analytics['kpis']['revenue']['value']);
        $this->assertSame(3, $analytics['kpis']['salesCount']['value']);
        $this->assertEquals(2900, $analytics['kpis']['marginRate']['margin']);
        $this->assertEquals(7700, collect($analytics['salesChart'])->sum('value'));
        $this->assertEquals(7700, $analytics['topProducts'][0]['revenue']);
        $this->assertEquals(7700, collect($analytics['shopPerformance'])->firstWhere('id', $this->shop->id)['revenue']);
        // The year comparison holds this month too.
        $this->assertEquals(7700, $analytics['comparisonData']['totals']['revenue']['v1']);
        $this->assertEquals(2900, $analytics['comparisonData']['totals']['profit']['v1']);
    }

    public function test_the_month_comparison_and_the_hourly_chart_agree_too(): void
    {
        $analytics = $this->props('analytics', [
            'period' => 'today', 'compare_mode' => 'month',
            'month1' => now()->month, 'month_year1' => now()->year, 'month2' => now()->month, 'month_year2' => now()->year - 1,
        ]);

        $this->assertEquals(7700, collect($analytics['salesChart'])->sum('value'));
        $this->assertEquals(7700, $analytics['comparisonData']['totals']['revenue']['v1']);
        $this->assertEquals(0, $analytics['comparisonData']['totals']['revenue']['v2']);
    }
}
