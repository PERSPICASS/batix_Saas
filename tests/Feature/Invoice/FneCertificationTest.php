<?php

namespace Tests\Feature\Invoice;

use App\Jobs\CertifyWithFne;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Shop;
use App\Models\User;
use App\Services\Fne\FneDisplay;
use App\Services\Fne\FneService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * FNE — Côte d'Ivoire's standardised electronic invoice. An issued invoice is presented to
 * the DGI, which certifies it (FNE number + QR sticker). A credit note on it goes through
 * the DGI's refund endpoint, which designates the DGI's own ids for the invoice and lines.
 *
 * The API has no idempotency key: replaying a request the DGI already processed creates a
 * SECOND fiscal invoice. Most of what is tested here is about never doing that.
 */
class FneCertificationTest extends TestCase
{
    use RefreshDatabase;

    private const SIGN_URL = 'http://54.247.95.108/ws/external/invoices/sign';

    private function fneShop(array $overrides = []): Shop
    {
        return Shop::factory()->create($overrides + [
            'country' => "Côte d'Ivoire",
            'currency' => 'XOF',
            'fne_enabled' => true,
            'fne_environment' => 'test',
            'fne_api_key' => 'secret-key',
            'fne_establishment' => 'Quincaillerie Riviera',
            'fne_point_of_sale' => 'Caisse 1',
        ]);
    }

    private function owner(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $user;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function invoice(Shop $shop, string $status = 'draft', array $items = [], array $attributes = [], ?Customer $customer = null): Invoice
    {
        $customer ??= Customer::factory()->create(['shop_id' => $shop->id, 'phone' => '07 09 08 07 65', 'email' => 'client@example.ci']);

        $invoice = Invoice::create($attributes + [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'invoice_date' => now()->toDateString(),
            'status' => 'draft',
        ]);

        foreach ($items ?: [['product_name' => 'Ciment 50kg', 'quantity' => 10, 'unit_price' => 5000, 'tax_rate' => 18]] as $item) {
            $invoice->items()->create($item);
        }

        if ($status !== 'draft') {
            $invoice->update(['status' => $status]);
        }

        return $invoice->fresh(['items']);
    }

    /** @param  array<int, string>  $itemIds */
    private function certifiedResponse(array $itemIds = ['fne-item-1'], float $amount = 59000): array
    {
        return [
            'ncc' => '9606123E',
            'reference' => '9606123E25000000019',
            'token' => 'http://54.247.95.108/fr/verification/019465c1',
            'warning' => false,
            'balance_sticker' => 179,
            'invoice' => [
                'id' => 'fne-invoice-1',
                'amount' => $amount,
                'items' => array_map(fn ($id) => ['id' => $id], $itemIds),
            ],
        ];
    }

    // --- Payload ---------------------------------------------------------------------

    public function test_the_payload_follows_the_dgi_spec(): void
    {
        $shop = $this->fneShop();
        $this->owner($shop);
        $customer = Customer::factory()->create([
            'shop_id' => $shop->id,
            'name' => 'BTP Plus SARL',
            'phone' => '07 09 08 07 65',
            'email' => 'achats@btpplus.ci',
            'fne_template' => 'B2B',
            'ncc' => '9502363N',
        ]);

        $invoice = $this->invoice($shop, 'draft', [
            ['product_name' => 'Ciment', 'quantity' => 10, 'unit_price' => 5000, 'tax_rate' => 18, 'discount_amount' => 5000],
            ['product_name' => 'Riz', 'quantity' => 2, 'unit_price' => 1000, 'tax_rate' => 9],
            ['product_name' => 'Engrais', 'quantity' => 1, 'unit_price' => 3000, 'tax_rate' => 0],
        ], ['status' => 'draft', 'discount_amount' => 5000, 'payment_method' => 'mobile'], $customer);
        $invoice->forceFill(['status' => 'paid'])->saveQuietly();

        $payload = app(FneService::class)->buildInvoicePayload($invoice->fresh());

        $this->assertSame('sale', $payload['invoiceType']);
        $this->assertSame('mobile-money', $payload['paymentMethod']);
        $this->assertSame('B2B', $payload['template']);
        $this->assertSame('9502363N', $payload['clientNcc']);
        $this->assertSame('0709080765', $payload['clientPhone']);
        $this->assertSame('Quincaillerie Riviera', $payload['establishment']);
        $this->assertSame('Caisse 1', $payload['pointOfSale']);
        $this->assertFalse($payload['isRne']);

        $this->assertSame(['TVA'], $payload['items'][0]['taxes']);
        $this->assertSame(['TVAB'], $payload['items'][1]['taxes']);
        $this->assertSame(['TVAD'], $payload['items'][2]['taxes']);

        // Unit price excluding tax, and discounts as PERCENTAGES: 5000 off 50 000 is 10 %.
        $this->assertSame(5000.0, $payload['items'][0]['amount']);
        $this->assertSame(10.0, $payload['items'][0]['discount']);
        // Global discount on the discounted base: 5000 off (45 000 + 2 000 + 3 000) = 10 %.
        $this->assertSame(10.0, $payload['discount']);
    }

    public function test_an_unpaid_issued_invoice_is_deferred_payment_for_the_dgi(): void
    {
        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop);
        $invoice->forceFill(['status' => 'sent'])->saveQuietly();

        $payload = app(FneService::class)->buildInvoicePayload($invoice->fresh());

        $this->assertSame('deferred', $payload['paymentMethod']);
        $this->assertSame('B2C', $payload['template']);
        $this->assertArrayNotHasKey('clientNcc', $payload);
    }

    public function test_the_zero_rate_code_follows_the_shops_regime(): void
    {
        $shop = $this->fneShop(['fne_zero_rate_code' => 'TVAC']);
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'draft', [['product_name' => 'Engrais', 'quantity' => 1, 'unit_price' => 3000, 'tax_rate' => 0]]);

        $payload = app(FneService::class)->buildInvoicePayload($invoice);

        $this->assertSame(['TVAC'], $payload['items'][0]['taxes']);
    }

    public function test_a_rate_unknown_to_the_dgi_is_a_problem_before_issuance(): void
    {
        $shop = $this->fneShop();

        $problems = app(FneService::class)->issuanceProblems($shop, null, [18, 10]);

        $this->assertCount(1, $problems);
        $this->assertStringContainsString('10 %', $problems[0]);
    }

    public function test_a_b2b_customer_without_ncc_is_a_problem_before_issuance(): void
    {
        $shop = $this->fneShop();
        $customer = Customer::factory()->make(['fne_template' => 'B2B', 'ncc' => null]);

        $this->assertNotEmpty(app(FneService::class)->issuanceProblems($shop, $customer, [18]));
    }

    // --- When certification starts ---------------------------------------------------

    public function test_issuing_an_invoice_certifies_it(): void
    {
        Http::fake([self::SIGN_URL => Http::response($this->certifiedResponse(), 200)]);

        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => $request->hasHeader('Authorization', 'Bearer secret-key'));

        $this->assertSame('certified', $invoice->fne_status);
        $this->assertSame('9606123E25000000019', $invoice->fne_reference);
        $this->assertSame('fne-invoice-1', $invoice->fne_invoice_id);
        $this->assertSame('fne-item-1', $invoice->items->first()->fne_item_id);
        $this->assertSame(179, $shop->fresh()->fne_balance_sticker);
    }

    public function test_a_draft_is_not_presented_to_the_dgi(): void
    {
        Http::fake();

        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'draft');

        Http::assertNothingSent();
        $this->assertNull($invoice->fne_status);
    }

    public function test_a_shop_outside_cote_divoire_never_calls_the_dgi(): void
    {
        Http::fake();

        $shop = $this->fneShop(['country' => 'Sénégal']);
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        Http::assertNothingSent();
        $this->assertNull($invoice->fne_status);
    }

    public function test_the_french_localised_country_name_is_recognised(): void
    {
        $this->assertTrue(Shop::factory()->make(['country' => "Côte-d'Ivoire"])->isInCoteDIvoire());
        $this->assertTrue(Shop::factory()->make(['country' => 'Côte d’Ivoire'])->isInCoteDIvoire());
        $this->assertTrue(Shop::factory()->make(['country' => 'Ivory Coast'])->isInCoteDIvoire());
        $this->assertFalse(Shop::factory()->make(['country' => 'France'])->isInCoteDIvoire());
    }

    public function test_marking_a_certified_invoice_paid_does_not_certify_it_again(): void
    {
        Http::fake([self::SIGN_URL => Http::response($this->certifiedResponse(), 200)]);

        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');
        $invoice->update(['status' => 'paid', 'payment_method' => 'cash']);

        Http::assertSentCount(1);
    }

    /**
     * An invoice issued before the shop switched FNE on was never presented: being paid
     * later must not turn it into a fiscal invoice dated today.
     */
    public function test_an_invoice_issued_before_activation_is_not_certified_when_paid(): void
    {
        Http::fake();

        $shop = $this->fneShop(['fne_enabled' => false]);
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $shop->update(['fne_enabled' => true]);
        $invoice->fresh()->update(['status' => 'paid']);

        Http::assertNothingSent();
    }

    // --- What each answer allows -----------------------------------------------------

    public function test_a_dgi_rejection_fails_without_retrying(): void
    {
        Http::fake([self::SIGN_URL => Http::response(['message' => 'Point of sale is not valid', 'statusCode' => 400], 400)]);

        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $this->assertSame('failed', $invoice->fne_status);
        $this->assertStringContainsString('Point of sale is not valid', $invoice->fne_error);
        $this->assertTrue($invoice->fneRetryable());
    }

    public function test_an_unavailable_service_is_retried(): void
    {
        Http::fake([self::SIGN_URL => Http::response(['message' => 'Internal Server Error'], 500)]);

        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        // Back to pending: the job releases itself for a later attempt.
        $this->assertSame('pending', $invoice->fne_status);
        $this->assertSame(1, $invoice->fne_attempts);
    }

    public function test_a_refused_connection_is_retried(): void
    {
        Http::fake(fn () => throw new ConnectionException('cURL error 7: Failed to connect to 54.247.95.108 port 80'));

        $shop = $this->fneShop();
        $this->owner($shop);

        $this->assertSame('pending', $this->invoice($shop, 'sent')->fne_status);
    }

    /**
     * A read timeout means the request left: the DGI may have certified it. Replaying it
     * could create a second fiscal invoice, so nothing retries on its own.
     */
    public function test_a_lost_answer_is_uncertain_and_not_retried(): void
    {
        Http::fake(fn () => throw new ConnectionException('cURL error 28: Operation timed out after 30001 milliseconds with 0 bytes received'));

        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $this->assertSame('uncertain', $invoice->fne_status);
    }

    public function test_a_second_run_never_presents_the_invoice_twice(): void
    {
        Http::fake([self::SIGN_URL => Http::response($this->certifiedResponse(), 200)]);

        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        (new CertifyWithFne($invoice))->handle(app(FneService::class));

        Http::assertSentCount(1);
    }

    public function test_a_run_already_in_flight_blocks_another(): void
    {
        Http::fake();

        $shop = $this->fneShop(['fne_enabled' => false]);
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');
        $shop->update(['fne_enabled' => true]);

        DB::table('invoices')->where('id', $invoice->id)->update(['fne_status' => 'sending']);
        (new CertifyWithFne($invoice->fresh()))->handle(app(FneService::class));

        Http::assertNothingSent();
    }

    // --- Cancelling, crediting, retrying ---------------------------------------------

    public function test_a_certified_invoice_cannot_be_cancelled(): void
    {
        Http::fake([self::SIGN_URL => Http::response($this->certifiedResponse(), 200)]);

        $shop = $this->fneShop();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $this->actingAs($user)
            ->post("/{$user->code_user}/factures/{$invoice->id}/statut", ['status' => 'cancelled'])
            ->assertSessionHas('error');

        $this->assertSame('sent', $invoice->fresh()->status);
    }

    public function test_a_credit_note_is_certified_on_the_dgi_line_ids(): void
    {
        Http::fake([
            self::SIGN_URL => Http::response($this->certifiedResponse(['fne-item-1']), 200),
            'http://54.247.95.108/ws/external/invoices/fne-invoice-1/refund' => Http::response([
                'reference' => 'A9606123E2500000006',
                'token' => 'http://54.247.95.108/fr/verification/019465ca',
                'warning' => false,
                'balance_sticker' => 178,
            ], 201),
        ]);

        $shop = $this->fneShop();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $this->actingAs($user)->post("/{$user->code_user}/factures/{$invoice->id}/avoir", [
            'reason' => 'Retour marchandise',
            'items' => [['invoice_item_id' => $invoice->items->first()->id, 'quantity' => 3]],
        ])->assertSessionHas('success');

        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/fne-invoice-1/refund')
            && $request->data() === ['items' => [['id' => 'fne-item-1', 'quantity' => 3]]]);

        $creditNote = CreditNote::firstOrFail();
        $this->assertSame('certified', $creditNote->fne_status);
        $this->assertSame('A9606123E2500000006', $creditNote->fne_reference);
    }

    public function test_no_credit_note_while_the_invoice_awaits_certification(): void
    {
        Http::fake([self::SIGN_URL => Http::response(['message' => 'Internal Server Error'], 500)]);

        $shop = $this->fneShop();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $this->actingAs($user)->post("/{$user->code_user}/factures/{$invoice->id}/avoir", [
            'reason' => 'Retour',
            'items' => [['invoice_item_id' => $invoice->items->first()->id, 'quantity' => 1]],
        ])->assertSessionHas('error');

        $this->assertSame(0, CreditNote::count());
    }

    public function test_retrying_an_uncertain_invoice_requires_confirmation(): void
    {
        Http::fake([self::SIGN_URL => Http::sequence()
            ->pushFailedConnection('cURL error 28: Operation timed out after 30001 milliseconds')
            ->push($this->certifiedResponse(), 200)]);

        $shop = $this->fneShop();
        $user = $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');
        $this->assertSame('uncertain', $invoice->fne_status);

        $this->actingAs($user)
            ->post("/{$user->code_user}/factures/{$invoice->id}/fne/relancer")
            ->assertSessionHasErrors('confirmed');

        $this->assertSame('uncertain', $invoice->fresh()->fne_status);

        $this->actingAs($user)
            ->post("/{$user->code_user}/factures/{$invoice->id}/fne/relancer", ['confirmed' => true])
            ->assertSessionHas('success');

        $this->assertSame('certified', $invoice->fresh()->fne_status);
    }

    public function test_issuing_with_a_rate_unknown_to_the_dgi_is_refused(): void
    {
        Http::fake();

        $shop = $this->fneShop();
        $user = $this->owner($shop);
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $this->actingAs($user)->post("/{$user->code_user}/factures", [
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'invoice_date' => now()->toDateString(),
            'status' => 'sent',
            'items' => [['product_name' => 'Tôle', 'quantity' => 1, 'unit_price' => 1000, 'tax_rate' => 10]],
        ])->assertSessionHasErrors('fne');

        $this->assertSame(0, Invoice::count());
        Http::assertNothingSent();
    }

    // --- Display and secrets ---------------------------------------------------------

    public function test_the_certified_pdf_carries_the_qr_code_and_fne_number(): void
    {
        Http::fake([self::SIGN_URL => Http::response($this->certifiedResponse(), 200)]);

        $shop = $this->fneShop();
        $this->owner($shop);
        $invoice = $this->invoice($shop, 'sent');

        $html = view('pdf.invoice', [
            'invoice' => $invoice->load(['shop', 'customer']),
            'logo' => null,
            'shop' => $shop,
            'currencySymbol' => 'CFA',
            'taxBreakdown' => [],
            'fne' => FneDisplay::for($invoice),
        ])->render();

        $this->assertStringContainsString('data:image/png;base64,', $html);
        $this->assertStringContainsString('9606123E25000000019', $html);
    }

    public function test_the_api_key_is_encrypted_and_never_serialised(): void
    {
        $shop = $this->fneShop();

        $this->assertNotSame('secret-key', DB::table('shops')->where('id', $shop->id)->value('fne_api_key'));
        $this->assertSame('secret-key', $shop->fresh()->fne_api_key);
        $this->assertArrayNotHasKey('fne_api_key', $shop->fresh()->toArray());
    }

    public function test_fne_settings_cannot_be_enabled_outside_cote_divoire(): void
    {
        $shop = Shop::factory()->create(['country' => 'France']);
        $user = $this->owner($shop);

        $this->actingAs($user)->patch("/{$user->code_user}/parametres/fne", [
            'fne_enabled' => true,
            'fne_environment' => 'test',
            'fne_api_key' => 'k',
            'fne_establishment' => 'E',
            'fne_point_of_sale' => 'P',
            'fne_zero_rate_code' => 'TVAD',
        ])->assertSessionHas('error');

        $this->assertFalse((bool) $shop->fresh()->fne_enabled);
    }
}
