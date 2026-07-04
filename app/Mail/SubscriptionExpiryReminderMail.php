<?php

namespace App\Mail;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionExpiryReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User         $user,
        public Subscription $subscription,
        public int          $daysLeft,
    ) {
        $this->locale($this->user->getLocale() ?? 'fr');
    }

    public function envelope(): Envelope
    {
        $locale = $this->user->getLocale() ?? 'fr';

        $subject = $this->daysLeft <= 1
            ? __('mail.subscription_expiry.subject_expires_today', ['appName' => config('app.name')], $locale)
            : __('mail.subscription_expiry.subject_expires_soon', [
                'appName' => config('app.name'),
                'days' => $this->daysLeft,
            ], $locale);

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.subscription-expiry-reminder');
    }

    public function attachments(): array
    {
        return [];
    }
}
