<?php

namespace App\Mail;

use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User                $user,
        public Subscription        $subscription,
        public SubscriptionInvoice $invoice,
    ) {}

    public function envelope(): Envelope
    {
        $locale = $this->user->getLocale() ?? 'fr';

        return new Envelope(
            subject: __('mail.subscription_invoice.subject', [
                'appName' => config('app.name'),
                'invoiceNumber' => $this->invoice->invoice_number,
            ], $locale),
            locale: $locale,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-invoice',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
