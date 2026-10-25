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
 * Le résumé quotidien des alertes d'un propriétaire (AlertDigest), envoyé par
 * alerts:send-daily seulement quand il y a quelque chose à signaler.
 */
class DailyAlertsMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public array $digest)
    {
        $this->locale($this->user->getLocale());
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('mail.daily_alerts.subject', ['appName' => config('app.name')], $this->user->getLocale()),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.daily-alerts',
            with: [
                'overviewUrl' => rtrim(config('app.url'), '/').'/'.$this->user->code_user.'/mes-boutiques',
                'unsubscribeUrl' => self::unsubscribeUrl($this->user),
            ],
        );
    }

    /** Signature relative, comme TrialFollowupMail : nginx ne transmet pas le schéma à PHP. */
    public static function unsubscribeUrl(User $user): string
    {
        return rtrim(config('app.url'), '/').URL::signedRoute('alerts.unsubscribe', ['user' => $user->id], absolute: false);
    }
}
