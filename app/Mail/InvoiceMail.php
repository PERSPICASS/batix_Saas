<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invoice $invoice)
    {
    }

    public function envelope(): Envelope
    {
        $locale = $this->invoice->customer->user->getLocale() ?? 'fr';

        return new Envelope(
            subject: __('mail.invoice.subject', ['number' => $this->invoice->invoice_number], $locale),
            from: config('mail.from.address'),
            locale: $locale,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice',
            with: [
                'invoice' => $this->invoice,
                'shopName' => $this->invoice->shop->name,
            ],
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromStorage("invoices/{$this->invoice->id}.pdf")
                ->as("Facture-{$this->invoice->invoice_number}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
