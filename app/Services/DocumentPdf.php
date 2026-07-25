<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as PdfWrapper;

/**
 * La génération PDF des pièces commerciales.
 *
 * Le projet n'en avait aucune — pas de bibliothèque, rien qui écrive de PDF nulle part —
 * alors que QuoteMail et InvoiceMail attachaient déjà `quotes/{id}.pdf`. L'envoi échouait
 * donc systématiquement (voir 5d669b3).
 *
 * Rien n'est stocké sur disque : le PDF est produit à la demande. Une pièce est immuable
 * une fois émise, son rendu est donc reproductible à l'identique, et un fichier stocké ne
 * serait qu'un cache à invalider — plus une copie de données fiscales à sauvegarder et à
 * purger.
 *
 * Le ticket sort au format ruban 80 mm, celui des imprimantes de caisse. La facture et le
 * devis sortent en A4.
 */
class DocumentPdf
{
    /** Largeur d'un ruban de caisse 80 mm, en points PostScript (1 pt = 1/72"). */
    private const RECEIPT_WIDTH = 226.77;

    /** En-tête, méta, totaux et pied : ce que le ticket occupe sans aucune ligne. */
    private const RECEIPT_BASE_HEIGHT = 250;

    /** Un article occupe deux lignes : son libellé, puis quantité × prix. */
    private const RECEIPT_LINE_HEIGHT = 24;

    public function forSale(Sale $sale): PdfWrapper
    {
        $sale->loadMissing(['items', 'shop', 'customer', 'user']);

        return Pdf::loadView('pdf.ticket', [
            'sale' => $sale,
            'shop' => $sale->shop,
            'currencySymbol' => get_currency_symbol($sale->shop?->currency),
        ])->setPaper([0, 0, self::RECEIPT_WIDTH, $this->receiptHeight($sale)]);
    }

    /**
     * Hauteur du ruban, ajustée au contenu.
     *
     * dompdf ne sait pas réduire un format au contenu : une hauteur fixe généreuse
     * imprimait une longue bande blanche après chaque ticket, soit du papier perdu à
     * chaque vente. La hauteur est donc estimée, avec une marge de sécurité — mieux vaut
     * quelques millimètres de trop qu'un ticket coupé.
     */
    private function receiptHeight(Sale $sale): float
    {
        $height = self::RECEIPT_BASE_HEIGHT
            + $sale->items->count() * self::RECEIPT_LINE_HEIGHT;

        // Une vente à crédit ajoute le reste dû et son échéance.
        if ($sale->remaining_amount > 0) {
            $height += 30;
        }

        if ($sale->status === 'cancelled') {
            $height += 25;
        }

        if ($sale->shop?->invoice_footer) {
            $height += 20;
        }

        return $height;
    }

    public function forInvoice(Invoice $invoice): PdfWrapper
    {
        $invoice->loadMissing(['items', 'shop', 'customer', 'user']);

        return Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'shop' => $invoice->shop,
            'currencySymbol' => get_currency_symbol($invoice->shop?->currency),
            // Ventilation par taux : une ligne « TVA » unique ne dit pas de quoi le montant
            // est fait, et les taux varient par ligne depuis 9583217.
            'taxBreakdown' => $this->taxBreakdown($invoice->items),
        ])->setPaper('a4');
    }

    public function forQuote(Quote $quote): PdfWrapper
    {
        $quote->loadMissing(['items', 'shop', 'customer', 'user']);

        return Pdf::loadView('pdf.quote', [
            'quote' => $quote,
            'shop' => $quote->shop,
            'currencySymbol' => get_currency_symbol($quote->shop?->currency),
            'taxBreakdown' => $this->taxBreakdown($quote->items, 'line_total'),
        ])->setPaper('a4');
    }

    /**
     * Base imposable et taxe, regroupées par taux.
     *
     * @return array<int, array{rate: float, base: float, tax: float}>
     */
    private function taxBreakdown($items, string $totalColumn = 'total'): array
    {
        $bands = [];

        foreach ($items as $item) {
            $rate = (float) ($item->tax_rate ?? 0);

            // Les lignes de facture stockent un total TTC (voir InvoiceItem::saving), les
            // lignes de devis un line_total HT : on ramène les deux à une base HT.
            $lineTotal = (float) $item->{$totalColumn};
            $base = $totalColumn === 'total'
                ? $lineTotal - (float) $item->tax_amount
                : $lineTotal;

            $key = (string) $rate;
            $bands[$key] ??= ['rate' => $rate, 'base' => 0.0, 'tax' => 0.0];
            $bands[$key]['base'] += $base;
            $bands[$key]['tax'] += $base * $rate / 100;
        }

        // Du taux le plus élevé au plus bas : l'exonéré se lit en dernier.
        usort($bands, fn ($a, $b) => $b['rate'] <=> $a['rate']);

        return array_map(
            fn ($band) => [
                'rate' => $band['rate'],
                'base' => round($band['base'], 2),
                'tax' => round($band['tax'], 2),
            ],
            $bands
        );
    }
}
