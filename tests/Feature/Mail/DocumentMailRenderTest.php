<?php

namespace Tests\Feature\Mail;

use App\Mail\InvoiceMail;
use App\Mail\QuoteMail;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * QuoteMail and InvoiceMail declared their template with `view:` while both templates
 * are built out of @component('mail::message'). The `mail` view namespace is only
 * registered by Illuminate\Mail\Markdown as it renders, so every send blew up with
 * "No hint path defined for [mail]" — reported from production on
 * POST /{code_user}/devis/{quote}/envoyer.
 *
 * Asserting on the Envelope alone never caught it: the crash is in the body. These
 * tests render the mailable, which is the only thing that exercises the namespace.
 */
class DocumentMailRenderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // attachments() streams a PDF out of storage; the body is what is under test.
        Storage::fake('local');
    }

    private function shop(string $currency): Shop
    {
        return Shop::factory()->create(['currency' => $currency]);
    }

    private function quote(Shop $shop): Quote
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        return Quote::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            // Quote has no creating hook to fill this in, unlike Invoice: the
            // controller calls generateNumber() itself.
            'quote_number' => Quote::generateNumber($shop->id),
            'status' => 'sent',
            'quote_date' => now()->toDateString(),
            'expiry_date' => now()->addDays(30)->toDateString(),
            'subtotal' => 1000,
            'tax_amount' => 200,
            'total' => 1200,
        ]);
    }

    private function invoice(Shop $shop): Invoice
    {
        $customer = Customer::factory()->create(['shop_id' => $shop->id]);

        return Invoice::create([
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'user_id' => $shop->user_id,
            'status' => 'sent',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'subtotal' => 1000,
            'tax_amount' => 200,
            'total' => 1200,
        ]);
    }

    /**
     * render() builds the body but never resolves attachments, which is exactly how the
     * missing PDF slipped past the first round of tests: the body was fixed, the send
     * still died on Attachment::fromStorage resolving an absent file to null. Going
     * through the mailer with the array transport builds the whole Symfony message,
     * attachments included.
     */
    public function test_a_quote_can_actually_be_sent(): void
    {
        config(['mail.default' => 'array']);

        $quote = $this->quote($this->shop('EUR'));

        Mail::to('client@example.com')->send(new QuoteMail($quote));

        $this->assertCount(1, app('mailer')->getSymfonyTransport()->messages());
    }

    public function test_an_invoice_can_actually_be_sent(): void
    {
        config(['mail.default' => 'array']);

        $invoice = $this->invoice($this->shop('EUR'));

        Mail::to('client@example.com')->send(new InvoiceMail($invoice));

        $this->assertCount(1, app('mailer')->getSymfonyTransport()->messages());
    }

    /**
     * The PDF is generated at send time rather than read off disk, so the attachment is
     * always there — and it is a real PDF, not a placeholder.
     */
    public function test_the_sent_quote_carries_a_generated_pdf(): void
    {
        config(['mail.default' => 'array']);

        $quote = $this->quote($this->shop('EUR'));

        Mail::to('client@example.com')->send(new QuoteMail($quote));

        $message = app('mailer')->getSymfonyTransport()->messages()[0]->getOriginalMessage();
        $attachments = $message->getAttachments();

        $this->assertCount(1, $attachments);
        $this->assertStringContainsString("Devis-{$quote->quote_number}.pdf", $attachments[0]->getFilename());
        $this->assertStringStartsWith('%PDF', $attachments[0]->getBody());
    }

    public function test_a_quote_mail_renders(): void
    {
        $quote = $this->quote($this->shop('EUR'));

        $body = (new QuoteMail($quote))->render();

        $this->assertStringContainsString($quote->quote_number, $body);
        $this->assertStringContainsString($quote->customer->name, $body);
    }

    public function test_an_invoice_mail_renders(): void
    {
        $invoice = $this->invoice($this->shop('EUR'));

        $body = (new InvoiceMail($invoice))->render();

        $this->assertStringContainsString($invoice->invoice_number, $body);
        $this->assertStringContainsString($invoice->customer->name, $body);
    }

    /**
     * The mail:: components live under a namespace nothing else registers, so their
     * markup is the signal that the template really went through Markdown rendering
     * rather than being emitted as raw Blade.
     */
    public function test_the_rendered_quote_uses_the_markdown_mail_layout(): void
    {
        $body = (new QuoteMail($this->quote($this->shop('EUR'))))->render();

        $this->assertStringNotContainsString('@component', $body);
        $this->assertStringContainsString('<table', $body, 'The markdown table should be compiled to HTML.');
    }

    /**
     * Both templates hardcoded a € sign, which commit 7aa2cf0 missed because it only
     * swept the React pages. A XOF shop must not be told its totals are in euros.
     */
    public function test_amounts_carry_the_shops_own_currency(): void
    {
        $quote = $this->quote($this->shop('XOF'));

        $body = (new QuoteMail($quote))->render();

        $this->assertStringContainsString('CFA', $body);
        $this->assertStringNotContainsString('€', $body);
    }

    /**
     * Mail is sent from queues and scheduled tasks, where auth() is empty — the
     * currency has to come off the document's own shop, never the current user's.
     */
    public function test_the_currency_does_not_depend_on_an_authenticated_user(): void
    {
        $quote = $this->quote($this->shop('XOF'));

        // A logged-in user whose own shop uses a different currency.
        $other = User::factory()->create(['shop_id' => $this->shop('EUR')->id]);
        $this->actingAs($other);

        $body = (new QuoteMail($quote))->render();

        $this->assertStringContainsString('CFA', $body);
        $this->assertStringNotContainsString('€', $body);
    }
}
