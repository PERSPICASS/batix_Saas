<?php

namespace Tests\Feature\Alerts;

use App\Mail\DailyAlertsMail;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\StockTransfer;
use App\Models\User;
use App\Services\AlertDigest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** The morning email: only when something needs the owner's attention, once a day. */
class DailyAlertsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Shop $shop;
    private Product $hammer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create(['name' => 'Cocody', 'currency' => 'XOF', 'is_active' => true]);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id, 'is_active' => true, 'is_demo' => false]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);

        $this->hammer = Product::factory()->create([
            'shop_id' => $this->shop->id, 'stock_quantity' => 100, 'track_stock' => true, 'tax_rate' => 0,
            'selling_price' => 1000, 'min_stock_alert' => 5, 'is_active' => true,
        ]);
    }

    private function sell(int $qty, string $date, array $attrs = []): Sale
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/ventes", array_merge([
            'shop_id' => $this->shop->id, 'payment_method' => 'cash', 'amount_paid' => $qty * 1000,
            'items' => [['product_id' => $this->hammer->id, 'quantity' => $qty, 'unit_price' => 1000]],
        ], $attrs))->assertSessionHasNoErrors();

        $sale = Sale::latest('id')->firstOrFail();
        $sale->update(['sale_date' => $date]);

        return $sale;
    }

    public function test_the_digest_flags_a_drop_overdue_payments_stock_and_a_late_transfer(): void
    {
        // 10 000 the week before; over the last 7 days 2 000 + the 2 000 credit sale below
        // (sold, credit included): 4 000, -60 %.
        $this->sell(10, now()->subDays(10)->toDateTimeString());
        $this->sell(2, now()->subDays(2)->toDateTimeString());
        // A credit sale due last week, 1 500 still owed.
        $credit = $this->sell(2, now()->subDays(3)->toDateTimeString(), ['payment_method' => 'credit', 'amount_paid' => 500]);
        // A due date cannot be in the past when the sale is made: it became past since.
        $credit->update(['credit_due_date' => now()->subDays(1)->toDateString()]);
        // One product out of stock, the hammer below its threshold.
        Product::factory()->create(['shop_id' => $this->shop->id, 'stock_quantity' => 0, 'track_stock' => true, 'is_active' => true]);
        $this->hammer->update(['stock_quantity' => 3]);
        // A transfer sent 5 days ago, still not received.
        $other = Shop::factory()->create(['name' => 'Yopougon', 'user_id' => $this->owner->id, 'is_active' => true]);
        StockTransfer::create(['from_shop_id' => $this->shop->id, 'to_shop_id' => $other->id, 'status' => 'in_transit', 'sent_at' => now()->subDays(5)]);

        $digest = app(AlertDigest::class)->for($this->owner);

        $cocody = collect($digest['shops'])->firstWhere('name', 'Cocody');
        $this->assertSame(-60, $cocody['alerts']['revenue_drop']['change']);
        $this->assertEquals(['count' => 1, 'owed' => 1500], $cocody['alerts']['overdue']);
        $this->assertEquals(['out_of_stock' => 1, 'low' => 1], $cocody['alerts']['stock']);
        $this->assertSame(5, $digest['transfers'][0]['days']);

        // The email says it in words, in the owner's language (CI runs with APP_LOCALE=en).
        $this->owner->forceFill(['locale' => 'fr'])->save();
        $html = (new DailyAlertsMail($this->owner, $digest))->render();
        $this->assertStringContainsString('Cocody', $html);
        $this->assertStringContainsString('-60 %', $html);
        $this->assertStringContainsString('1 500', $html);
        $this->assertStringContainsString('en route depuis 5 jours', $html);
        $this->assertStringContainsString('1</strong> produit(s) en rupture', $html);
        $this->assertStringContainsString('1 produit(s) sous le seuil', $html);
        $this->assertStringContainsString('/alertes/desinscription/', $html);
    }

    public function test_it_is_sent_once_a_day(): void
    {
        Mail::fake();
        $this->hammer->update(['stock_quantity' => 0]);

        $this->artisan('alerts:send-daily')->assertSuccessful();
        $this->artisan('alerts:send-daily')->assertSuccessful();

        Mail::assertSent(DailyAlertsMail::class, 1);
        Mail::assertSent(DailyAlertsMail::class, fn ($mail) => $mail->hasTo($this->owner->email));
    }

    public function test_nothing_to_report_sends_nothing(): void
    {
        Mail::fake();
        // Same revenue both weeks, stock fine, nobody owes anything.
        $this->sell(3, now()->subDays(10)->toDateTimeString());
        $this->sell(3, now()->subDays(2)->toDateTimeString());

        $this->artisan('alerts:send-daily')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_no_email_without_an_active_subscription_or_after_opting_out(): void
    {
        Mail::fake();
        $this->hammer->update(['stock_quantity' => 0]);

        // Not mass-assignable (only the signed unsubscribe link sets it): forceFill.
        $this->owner->forceFill(['alerts_opted_out_at' => now()])->save();
        $this->artisan('alerts:send-daily')->assertSuccessful();
        Mail::assertNothingSent();

        $this->owner->forceFill(['alerts_opted_out_at' => null])->save();
        // Saved model by model: saving a subscription clears its activeSubscription() memo.
        // Long expired, past the grace period during which the account still works.
        $this->owner->subscriptions()->get()->each->update(['status' => 'expired', 'expires_at' => now()->subDays(60)]);
        $this->artisan('alerts:send-daily')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_the_unsubscribe_link_works_only_when_signed(): void
    {
        $this->get("/alertes/desinscription/{$this->owner->id}")->assertForbidden();
        $this->assertNull($this->owner->fresh()->alerts_opted_out_at);

        $url = DailyAlertsMail::unsubscribeUrl($this->owner);
        $this->get(parse_url($url, PHP_URL_PATH) . '?' . parse_url($url, PHP_URL_QUERY))->assertOk();

        $this->assertNotNull($this->owner->fresh()->alerts_opted_out_at);
    }

    public function test_a_zero_count_is_not_written(): void
    {
        $this->owner->forceFill(['locale' => 'fr'])->save();
        $digest = ['shops' => [['id' => 1, 'name' => 'Cocody', 'currency' => 'XOF', 'alerts' => ['stock' => ['out_of_stock' => 0, 'low' => 37]]]], 'transfers' => []];

        $html = (new DailyAlertsMail($this->owner, $digest))->render();

        $this->assertStringContainsString('37 produit(s) sous le seuil', $html);
        $this->assertStringNotContainsString('rupture', $html);
    }
}
