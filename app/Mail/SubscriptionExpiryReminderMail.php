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
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->daysLeft <= 1
            ? 'Votre abonnement Batix expire demain !'
            : "Votre abonnement Batix expire dans {$this->daysLeft} jours";

        return new Envelope(subject: $subject);
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
