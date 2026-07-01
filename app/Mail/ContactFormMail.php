<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactFormMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $senderName;
    public string $senderEmail;
    public string $senderSubject;
    public string $senderMessage;

    public function __construct(string $senderName, string $senderEmail, string $senderSubject, string $senderMessage)
    {
        $this->senderName    = $senderName;
        $this->senderEmail   = $senderEmail;
        $this->senderSubject = $senderSubject;
        $this->senderMessage = $senderMessage;
    }

    public function envelope(): Envelope
    {
        // Default to 'fr' for contact form emails as sender may not be authenticated
        $locale = 'fr';

        return new Envelope(
            subject: __('mail.contact_form.subject', [
                'subject' => $this->senderSubject,
                'senderName' => $this->senderName,
            ], $locale),
            replyTo: [$this->senderEmail],
            locale: $locale,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-form',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
