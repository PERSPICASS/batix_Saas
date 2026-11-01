<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Relance d'un inscrit qui n'a pas créé sa boutique (J+1, J+3). Envoyée par
 * signups:send-shop-reminders ; même désinscription que les relances d'essai.
 */
class ShopReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public int $step)
    {
        $this->locale($this->user->getLocale());
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __("mail.shop_reminder.steps.{$this->step}.subject", ['appName' => config('app.name')], $this->user->getLocale()),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shop-reminder',
            with: [
                'createShopUrl' => rtrim(config('app.url'), '/').'/create-shop',
                'whatsappUrl' => 'https://wa.me/'.preg_replace('/\D/', '', (string) config('app.whatsapp_number')),
                'unsubscribeUrl' => TrialFollowupMail::unsubscribeUrl($this->user),
            ],
        );
    }
}
