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
    /**
     * Largeur d'un ruban de caisse 80 mm, en points PostScript (1 pt = 1/72").
     * La hauteur est volontairement généreuse : dompdf coupe à la fin du contenu.
     */
    private const RECEIPT_WIDTH = 226.77;

    public function forSale(Sale $sale): PdfWrapper
    {
        $sale->loadMissing(['items', 'shop', 'customer', 'user']);

        return Pdf::loadView('pdf.ticket', [
            'sale' => $sale,
            'shop' => $sale->shop,
            'currencySymbol' => get_currency_symbol($sale->shop?->currency),
        ])->setPaper([0, 0, self::RECEIPT_WIDTH, 1200]);
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
