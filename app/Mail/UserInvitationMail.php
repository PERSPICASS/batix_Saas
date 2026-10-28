<?php

namespace App\Mail;

use App\Models\User;
use App\Services\UserInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Le lien par lequel un employé choisit son mot de passe : invitation à la création de son
 * compte, ou nouveau mot de passe ensuite (cf. UserInvitation).
 */
class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public bool $pending;

    public function __construct(
        public User $user,
        public User $sentBy,
        public string $url,
    ) {
        $this->pending = $user->isInvitationPending();
        $this->locale($this->user->getLocale());
    }

    public function envelope(): Envelope
    {
        $key = $this->pending ? 'mail.user_invitation.subject' : 'mail.user_invitation.reset_subject';

        return new Envelope(
            subject: __($key, ['shop' => $this->shopName(), 'appName' => config('app.name')], $this->user->getLocale()),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.user-invitation',
            with: [
                'shop' => $this->shopName(),
                'days' => UserInvitation::VALID_DAYS,
            ],
        );
    }

    private function shopName(): string
    {
        return $this->user->shop?->name ?? config('app.name');
    }
}
