<?php

namespace App\Mail;

use App\Models\Quote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Quote $quote)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Devis {$this->quote->quote_number}",
            from: config('mail.from.address'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quote',
            with: [
                'quote' => $this->quote,
                'shopName' => $this->quote->shop->name,
            ],
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromStorage("quotes/{$this->quote->id}.pdf")
                ->as("Devis-{$this->quote->quote_number}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
