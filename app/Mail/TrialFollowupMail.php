<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

/**
 * Relance d'un compte dont l'essai gratuit est fini sans paiement. Une étape
 * par délai (1, 3, 7, 14, 30 jours), chacune avec son angle : voir
 * mail.trial_followup.steps. Envoyée par trials:send-followups.
 */
class TrialFollowupMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public int $step,
        public int $productsCount,
        public int $salesCount,
    ) {
        $this->locale($this->user->getLocale());
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __("mail.trial_followup.steps.{$this->step}.subject", ['appName' => config('app.name')], $this->user->getLocale()),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.trial-followup',
            with: [
                'plansUrl' => rtrim(config('app.url'), '/').'/plans',
                'whatsappUrl' => 'https://wa.me/'.preg_replace('/\D/', '', (string) config('app.whatsapp_number')),
                'unsubscribeUrl' => self::unsubscribeUrl($this->user),
            ],
        );
    }

    /**
     * Lien de désinscription en un clic. Signature relative : nginx ne transmet
     * pas le schéma à PHP, une signature absolue renverrait 403 en prod (voir
     * DocumentLink).
     */
    public static function unsubscribeUrl(User $user): string
    {
        return rtrim(config('app.url'), '/').URL::signedRoute('trial-followups.unsubscribe', ['user' => $user->id], absolute: false);
    }
}
