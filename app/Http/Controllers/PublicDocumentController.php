<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Sale;
use App\Services\DocumentPdf;

/**
 * Les pièces commerciales consultables sans compte, par lien signé.
 *
 * Le client d'une quincaillerie n'a pas de compte : pour lui envoyer son ticket par
 * WhatsApp il faut une adresse qu'il puisse ouvrir. Un lien `wa.me` ne transporte que du
 * texte, jamais de fichier — c'est donc ce lien qui *est* son exemplaire.
 *
 * La sécurité tient à la signature : Laravel scelle l'URL entière avec la clé de
 * l'application, donc un identifiant modifié invalide le lien. Rien n'est devinable, rien
 * n'est énumérable, et le cloisonnement entre boutiques est intact — chaque lien ne donne
 * accès qu'à une seule pièce, celle qu'on a explicitement partagée.
 *
 * Les liens expirent (voir DocumentLink) : un lien partagé par message survit au message,
 * et un exemplaire ne doit pas rester ouvert indéfiniment sur le web.
 */
class PublicDocumentController extends Controller
{
    public function ticket(Sale $sale, DocumentPdf $pdf)
    {
        return $pdf->forSale($sale)->stream("Ticket-{$sale->ticket_number}.pdf");
    }

    public function invoice(Invoice $invoice, DocumentPdf $pdf)
    {
        return $pdf->forInvoice($invoice)->stream("Facture-{$invoice->invoice_number}.pdf");
    }

    public function quote(Quote $quote, DocumentPdf $pdf)
    {
        return $pdf->forQuote($quote)->stream("Devis-{$quote->quote_number}.pdf");
    }
}
