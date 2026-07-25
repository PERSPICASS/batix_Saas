<?php

namespace App\Mail;

use App\Models\Quote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class QuoteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Quote $quote)
    {
        $this->locale($this->quote->shop->user->getLocale() ?? 'fr');
    }

    public function envelope(): Envelope
    {
        $locale = $this->quote->shop->user->getLocale() ?? 'fr';

        return new Envelope(
            subject: __('mail.quote.subject', ['number' => $this->quote->quote_number], $locale),
            from: config('mail.from.address'),
        );
    }

    /**
     * `markdown:` and not `view:`: emails/quote.blade.php is built out of
     * @component('mail::message'). It is Illuminate\Mail\Markdown that registers the
     * `mail` view namespace as it renders (Markdown::render → replaceNamespace), so
     * declaring the template as a plain view renders the Blade straight through the
     * view factory, Markdown never runs, and the mail:: components resolve against a
     * namespace that was never defined — "No hint path defined for [mail]".
     *
     * MailServiceProvider only registers that namespace itself when runningInConsole(),
     * which is why this can look fine from artisan and still fail on every HTTP send.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.quote',
            with: [
                'quote' => $this->quote,
                'shopName' => $this->quote->shop->name,
                // La devise de la boutique du devis, pas celle de l'expéditeur :
                // format_currency()/get_currency_symbol() sans argument passent par
                // auth()->user(), qui est nul depuis une queue et pointerait sur la
                // mauvaise boutique en multi-boutiques.
                'currencySymbol' => get_currency_symbol($this->quote->shop->currency),
            ],
        );
    }

    /**
     * Le PDF n'est joint que s'il existe.
     *
     * Rien dans le projet ne génère `quotes/{id}.pdf` — il n'y a aucune bibliothèque PDF,
     * ni côté PHP ni côté JavaScript. Attacher inconditionnellement faisait donc échouer
     * TOUT envoi : Attachment::fromStorage résout un fichier absent en null, et Symfony
     * refuse un corps de pièce jointe nul. L'erreur survenait après le rendu du message,
     * ce qu'un test sur render() ne peut pas voir.
     *
     * Le devis reste lisible dans le corps du mail. La condition disparaîtra le jour où
     * une génération de PDF existera.
     */
    public function attachments(): array
    {
        $path = "quotes/{$this->quote->id}.pdf";

        if (!Storage::exists($path)) {
            return [];
        }

        return [
            Attachment::fromStorage($path)
                ->as("Devis-{$this->quote->quote_number}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
