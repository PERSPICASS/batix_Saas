<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Services\DocumentPdf;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invoice $invoice)
    {
        // La langue de la BOUTIQUE, pas celle de l'interface du gérant : ce qu'un client
        // reçoit ne doit pas dépendre de la langue dans laquelle son fournisseur navigue.
        // Le PDF joint suit la même (voir DocumentPdf::inShopLocale) — les deux se
        // contredisaient, le corps suivant le gérant et la pièce jointe toujours en français.
        $this->locale($this->invoice->shop->documentLocale());
    }

    public function envelope(): Envelope
    {
        $locale = $this->invoice->shop->documentLocale();

        return new Envelope(
            subject: __('mail.invoice.subject', ['number' => $this->invoice->invoice_number], $locale),
            from: config('mail.from.address'),
        );
    }

    /**
     * `markdown:` and not `view:` — see the note on QuoteMail::content(): the template
     * uses @component('mail::message'), and only Markdown rendering registers the
     * `mail` view namespace.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.invoice',
            with: [
                'invoice' => $this->invoice,
                'shopName' => $this->invoice->shop->name,
                'currencySymbol' => get_currency_symbol($this->invoice->shop->currency),
            ],
        );
    }

    /**
     * Le PDF est produit au moment de l'envoi, pas lu sur le disque.
     *
     * Rien ne stockait `invoices/{id}.pdf` — aucune génération n'existait — donc
     * Attachment::fromStorage résolvait un fichier absent en null et Symfony faisait
     * échouer TOUT envoi. DocumentPdf le génère à la demande : la pièce est immuable, son
     * rendu est reproductible, et il n'y a ni cache à invalider ni copie de données
     * fiscales à sauvegarder.
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(
                fn () => app(DocumentPdf::class)->forInvoice($this->invoice)->output(),
                "Facture-{$this->invoice->invoice_number}.pdf"
            )->withMime('application/pdf'),
        ];
    }
}
