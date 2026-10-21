<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationCode extends Mailable
{
    use Queueable, SerializesModels;

    public string $verificationCode;
    public string $userName;

    /**
     * Create a new message instance.
     */
    public function __construct(string $verificationCode, string $userName, public ?User $user = null)
    {
        $this->verificationCode = $verificationCode;
        $this->userName = $userName;
        $this->locale($this->user?->getLocale() ?? 'fr');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $locale = $this->user?->getLocale() ?? 'fr';

        return new Envelope(
            subject: __('mail.verification_code.subject', ['appName' => config('app.name')], $locale),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.verification-code',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
