<?php

namespace Tests\Feature\Shop;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * « Mes boutiques ». Every sale, invoice and credit note goes through the real routes, so
 * the figures are checked against what the app actually stores. Amounts are worked out
 * by hand in the comments.
 */
class ShopsOverviewTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $cocody;
    private Shop $accra;
    private Product $hammer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cocody = Shop::factory()->create(['name' => 'Cocody', 'currency' => 'XOF']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->cocody->id]);
        $this->cocody->update(['user_id' => $this->owner->id]);
        $this->accra = Shop::factory()->create(['name' => 'Accra', 'currency' => 'GHS', 'user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->cocody);

        // Sold 1 000, costs 600 (weighted average) — the last purchase price must not be used.
        $this->hammer = $this->product($this->cocody);
    }

    private function product(Shop $shop): Product
    {
        return Product::factory()->create([
            'shop_id' => $shop->id, 'stock_quantity' => 100, 'track_stock' => true, 'tax_rate' => 0,
            'selling_price' => 1000, 'purchase_price' => 500, 'average_cost' => 600,
        ]);
    }

    private function sell(Shop $shop, Product $product, int $quantity, array $attrs = []): Sale
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", array_merge([
            'shop_id' => $shop->id,
            'payment_method' => 'cash',
            'amount_paid' => $quantity * 1000,
            'items' => [['product_id' => $product->id, 'quantity' => $quantity, 'unit_price' => 1000]],
        ], $attrs))->assertSessionHasNoErrors();

        return Sale::latest('id')->firstOrFail();
    }

    private function overview(array $query = []): AssertableInertia|\Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->owner)->get("/{$this->owner->code_user}/mes-boutiques?" . http_build_query($query));
    }

    private function figures(string $shopName, array $query = []): array
    {
        $rows = $this->overview($query)->assertOk()->viewData('page')['props']['rows'];

        return collect($rows)->firstWhere('name', $shopName);
    }

    public function test_each_shop_gets_its_figures_with_the_agreed_definitions(): void
    {
        $code = $this->owner->code_user;

        // 1. Cash sale: 3 × 1 000 with 300 off = 2 700. One hammer comes back (refund 900):
        //    total 1 800, net 1 800, cost 2 × 600 = 1 200.
        $paid = $this->sell($this->cocody, $this->hammer, 3, ['discount_amount' => 300, 'amount_paid' => 2700]);
        $this->actingAs($this->owner)->postJson("/{$code}/ventes/{$paid->id}/retours", [
            'sale_item_id' => $paid->items()->sole()->id, 'quantity_returned' => 1, 'refund_method' => 'cash', 'reason' => 'other',
        ])->assertOk();

        // 2. Credit sale: 2 × 1 000, 500 paid → counts in full (sold, credit included), 1 500 owed.
        $this->sell($this->cocody, $this->hammer, 2, ['payment_method' => 'credit', 'amount_paid' => 500]);

        // 3. Cancelled sale: counts for nothing.
        $cancelled = $this->sell($this->cocody, $this->hammer, 5);
        $this->actingAs($this->owner)->delete("/{$code}/ventes/{$cancelled->id}");
        $this->assertSame('cancelled', $cancelled->fresh()->status);

        // 4. Invoice sent: 4 × 1 000 = 4 000, cost 2 400. Credit note on 1: -1 000, cost -600.
        //    Still owed on the invoice: 4 000 - 1 000 = 3 000.
        $customer = Customer::factory()->create(['shop_id' => $this->cocody->id]);
        $this->actingAs($this->owner)->post("/{$code}/factures", [
            'shop_id' => $this->cocody->id, 'customer_id' => $customer->id, 'invoice_date' => now()->toDateString(), 'status' => 'sent',
            'items' => [['product_id' => $this->hammer->id, 'product_name' => 'Marteau', 'quantity' => 4, 'unit_price' => 1000]],
        ])->assertSessionHasNoErrors();
        $invoice = Invoice::sole();
        $this->actingAs($this->owner)->post("/{$code}/factures/{$invoice->id}/avoir", [
            'reason' => 'Retour', 'items' => [['invoice_item_id' => $invoice->items()->sole()->id, 'quantity' => 1]],
        ])->assertSessionHasNoErrors();

        // 5. An expense of the month.
        Expense::create(['shop_id' => $this->cocody->id, 'user_id' => $this->owner->id, 'title' => 'Loyer', 'amount' => 5000, 'expense_date' => now()->toDateString()]);

        $f = $this->figures('Cocody')['figures'];

        // CA = 1 800 + 2 000 + 4 000 - 1 000.
        $this->assertEquals(6800, $f['revenue']);
        // The two live sales and the invoice; the cancelled one is out.
        $this->assertSame(3, $f['count']);
        $this->assertEquals(2266.67, $f['average_basket']);
        // Margin = net 6 800 - cost (1 200 + 1 200 + 2 400 - 600 = 4 200).
        $this->assertEquals(2600, $f['gross_margin']);
        $this->assertEquals(5000, $f['expenses']);
        // Owed today = 1 500 (credit sale) + 3 000 (invoice net of its credit note).
        $this->assertEquals(4500, $f['receivables']);
        // Stock at cost, same definition as the shop page: 100 - 3 - 2 - 4 = 91 × 600. The
        // returned hammer is not back yet (it waits for approval in Retours d'inventaire),
        // and the cancelled sale put its 5 back.
        $this->assertEquals($this->cocody->fresh()->stockStats()['stock_value'], $f['stock_value']);
        $this->assertEquals(91 * 600, $f['stock_value']);
    }

    public function test_a_shop_without_sales_still_shows_and_last_month_is_the_comparison(): void
    {
        // Last month's sale: not in this month, but it is the comparison.
        $old = $this->sell($this->cocody, $this->hammer, 2);
        $old->update(['sale_date' => now()->subMonthNoOverflow()->startOfMonth()->addDays(3)]);
        $this->sell($this->cocody, $this->hammer, 1);

        $cocody = $this->figures('Cocody');
        $this->assertEquals(1000, $cocody['figures']['revenue']);
        $this->assertEquals(2000, $cocody['previous']['revenue']);

        // Accra sold nothing: it is listed anyway — the shop that does not sell is the one to see.
        $accra = $this->figures('Accra');
        $this->assertEquals(0, $accra['figures']['revenue']);
        $this->assertSame(0, $accra['figures']['count']);
    }

    public function test_totals_are_given_per_currency(): void
    {
        $this->sell($this->cocody, $this->hammer, 2);
        $this->sell($this->accra, $this->product($this->accra), 1);

        $this->overview()->assertInertia(fn (AssertableInertia $page) => $page
            ->has('totals', 2)
            ->where('totals.0.currency', 'GHS')
            ->where('totals.0.figures.revenue', 1000)
            ->where('totals.1.currency', 'XOF')
            ->where('totals.1.figures.revenue', 2000));
    }

    public function test_a_custom_period_is_compared_with_as_many_days_just_before(): void
    {
        $this->overview(['period' => 'custom', 'date_from' => '2026-10-10', 'date_to' => '2026-10-16'])
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('period.start', '2026-10-10')
                ->where('period.previous_start', '2026-10-03')
                ->where('period.previous_end', '2026-10-09'));
    }

    public function test_only_the_account_owner_sees_it(): void
    {
        $manager = User::factory()->create(['role' => 'manager', 'shop_id' => $this->cocody->id]);

        $this->actingAs($manager)->get("/{$this->owner->code_user}/mes-boutiques")->assertForbidden();
    }

    public function test_another_account_shops_never_appear(): void
    {
        $stranger = Shop::factory()->create(['name' => 'Chez un autre']);
        $this->sell($this->cocody, $this->hammer, 1);

        $names = collect($this->overview()->viewData('page')['props']['rows'])->pluck('name');

        $this->assertEqualsCanonicalizing(['Cocody', 'Accra'], $names->all());
        $this->assertNotContains($stranger->name, $names);
    }

    private function exportSheet(array $query = []): \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet
    {
        $response = $this->actingAs($this->owner)->get("/{$this->owner->code_user}/mes-boutiques/export?" . http_build_query($query));
        $response->assertOk();

        return \PhpOffice\PhpSpreadsheet\IOFactory::load($response->baseResponse->getFile()->getPathname())->getActiveSheet();
    }

    public function test_the_export_holds_the_screen_figures_with_the_comparison(): void
    {
        $old = $this->sell($this->cocody, $this->hammer, 2);
        $old->update(['sale_date' => now()->subMonthNoOverflow()->startOfMonth()->addDays(3)]);
        $this->sell($this->cocody, $this->hammer, 3);

        $sheet = $this->exportSheet();

        $this->assertStringStartsWith('Mes boutiques — du ', $sheet->getCell('A1')->getValue());
        $headings = $sheet->rangeToArray('A3:P3')[0];
        $this->assertSame(['Boutique', 'Devise', 'CA', 'CA (période précédente)', 'CA : évolution'], array_slice($headings, 0, 5));

        // Rows sorted by name: Accra, Cocody, then one total per currency.
        $rows = collect($sheet->rangeToArray('A4:E7', null, true, false));
        $cocody = $rows->firstWhere(0, 'Cocody');
        $this->assertSame('XOF', $cocody[1]);
        $this->assertEquals(3000, $cocody[2]);
        $this->assertEquals(2000, $cocody[3]);
        // +50 %, stored as a number shown as a percentage.
        $this->assertEquals(0.5, $cocody[4]);
        $this->assertSame('+0.0%;-0.0%;0.0%', $sheet->getStyle('E5')->getNumberFormat()->getFormatCode());

        // A shop with nothing before has no evolution rather than a fake +100 %.
        $this->assertNull($rows->firstWhere(0, 'Accra')[4]);

        $this->assertSame(['Total GHS', 'Total XOF'], $rows->pluck(0)->filter(fn ($v) => str_starts_with((string) $v, 'Total'))->values()->all());
        $this->assertTrue($sheet->getStyle('A7')->getFont()->getBold());
    }

    public function test_the_export_is_for_the_account_owner_only(): void
    {
        $manager = User::factory()->create(['role' => 'manager', 'shop_id' => $this->cocody->id]);

        $this->actingAs($manager)->get("/{$this->owner->code_user}/mes-boutiques/export")->assertForbidden();
    }

    public function test_a_shop_name_cannot_inject_a_formula(): void
    {
        $this->accra->update(['name' => '=HYPERLINK("http://evil")']);

        $sheet = $this->exportSheet();
        $cell = $sheet->getCell('A4');

        $this->assertSame(\PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING, $cell->getDataType());
        $this->assertStringStartsWith("'=", (string) $cell->getValue());
    }
}
