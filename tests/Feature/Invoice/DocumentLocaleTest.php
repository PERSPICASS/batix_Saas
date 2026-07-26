<?php

namespace Tests\Feature\Invoice;

use App\Mail\QuoteMail;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use App\Services\DocumentPdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * What language a customer receives.
 *
 * It used to come from `users.locale` — the manager's INTERFACE language — so a customer in
 * Abidjan got a quote in English because their supplier browsed in English. Worse, the
 * attached PDF stayed French whatever happened, its templates being hardcoded: the body and
 * its attachment could contradict each other.
 *
 * A document addressed to a customer belongs to the shop, not to a display preference.
 */
class DocumentLocaleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function shop(string $locale): Shop
    {
        $shop = Shop::factory()->create(['locale' => $locale, 'currency' => 'XOF']);
        $shop->update(['user_id' => User::factory()->create(['shop_id' => $shop->id])->id]);

        return $shop->fresh();
    }

    private function invoice(Shop $shop): Invoice
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        $invoice = Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'sent',
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
        ]);

        $invoice->items()->create([
            'product_name' => 'Ciment 50kg',
            'quantity' => 1,
            'unit_price' => 5000,
            'tax_rate' => 18,
        ]);

        return $invoice->fresh();
    }

    private function quote(Shop $shop): Quote
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        return Quote::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'quote_number' => Quote::generateNumber($shop->id),
            'status' => 'sent',
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(30)->toDateString(),
            'subtotal' => 1000,
            'tax_amount' => 180,
            'total' => 1180,
        ]);
    }

    public function test_french_is_the_default(): void
    {
        $shop = Shop::factory()->create();

        $this->assertSame('fr', $shop->documentLocale());
    }

    public function test_an_english_shop_gets_an_english_invoice(): void
    {
        $pdf = app(DocumentPdf::class)->forInvoice($this->invoice($this->shop('en')));

        $this->assertStringContainsString('INVOICE', $pdf->getDomPDF()->outputHtml());
        $this->assertStringNotContainsString('FACTURE', $pdf->getDomPDF()->outputHtml());
    }

    public function test_a_french_shop_gets_a_french_invoice(): void
    {
        $pdf = app(DocumentPdf::class)->forInvoice($this->invoice($this->shop('fr')));

        $this->assertStringContainsString('FACTURE', $pdf->getDomPDF()->outputHtml());
    }

    /**
     * The body and its attachment must agree — that was the whole inconsistency.
     */
    public function test_the_mail_and_its_pdf_speak_the_same_language(): void
    {
        config(['mail.default' => 'array']);

        $quote = $this->quote($this->shop('en'));

        \Illuminate\Support\Facades\Mail::to('client@example.com')->send(new QuoteMail($quote));

        $message = app('mailer')->getSymfonyTransport()->messages()[0]->getOriginalMessage();
        $body = $message->getHtmlBody() ?? '';
        $attachment = $message->getAttachments()[0]->getBody();

        // Le sujet et le corps en anglais…
        $this->assertStringContainsString('Quote', $message->getSubject());
        $this->assertStringContainsString('Hello', $body);

        // …et le PDF joint aussi, ce qui n'était pas le cas.
        $this->assertStringStartsWith('%PDF', $attachment);
    }

    /**
     * The manager may browse in another language than the one their documents are issued
     * in — the two must not be confused.
     */
    public function test_the_managers_interface_language_is_ignored(): void
    {
        $shop = $this->shop('fr');
        $shop->user->update(['locale' => 'en']);

        $pdf = app(DocumentPdf::class)->forInvoice($this->invoice($shop->fresh()));

        $this->assertStringContainsString('FACTURE', $pdf->getDomPDF()->outputHtml());
    }

    /**
     * The locale is set for the render and restored afterwards: it must not leak into the
     * rest of the request, which is still serving the manager's own interface.
     */
    public function test_rendering_does_not_leave_the_locale_behind(): void
    {
        app()->setLocale('fr');

        app(DocumentPdf::class)->forInvoice($this->invoice($this->shop('en')));

        $this->assertSame('fr', app()->getLocale());
    }
}
