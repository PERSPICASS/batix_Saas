<?php

namespace App\Exports;

use App\Exports\Concerns\SanitizesFormulaInjection;
use App\Models\SaleItem;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Les ventes ligne par ligne : une ligne Excel par article vendu.
 *
 * Le « montant payé » d'une ligne est son total TTC, diminué de sa part de la remise
 * globale de la vente. Cette remise n'est enregistrée que sur la vente, pas sur les
 * lignes (SaleCreationService) ; elle réduit HT et taxe dans la même proportion, donc
 * total vente / somme des totaux de ligne est le même ratio pour chaque ligne, et la
 * colonne s'additionne au total réellement encaissé (aux arrondis près).
 */
class SalesLinesExport implements FromQuery, WithHeadings, WithMapping, WithColumnFormatting, ShouldAutoSize, WithStyles, WithCustomValueBinder, WithStrictNullComparison
{
    use SanitizesFormulaInjection;

    private const PAYMENT_METHODS = [
        'cash' => 'Espèces',
        'card' => 'Carte',
        'transfer' => 'Virement',
        'check' => 'Chèque',
        'mobile' => 'Mobile money',
        'multiple' => 'Multiple',
        'credit' => 'Crédit',
    ];

    /** @param Builder $saleIds Sous-requête des id de ventes à exporter, déjà filtrée et cloisonnée. */
    public function __construct(private Builder $saleIds) {}

    public function query()
    {
        return SaleItem::query()
            ->select('sale_items.*')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereIn('sale_items.sale_id', $this->saleIds)
            ->with(['sale' => fn ($q) => $q->withSum('items as items_total', 'total')->with(['shop', 'customer'])])
            ->orderBy('sales.sale_date')
            ->orderBy('sale_items.sale_id')
            ->orderBy('sale_items.id');
    }

    public function headings(): array
    {
        return [
            'Date', 'N° ticket', 'Boutique', 'Client', 'Article', 'SKU', 'Quantité', 'Prix unitaire',
            'Remise', 'Montant payé', 'Devise', 'Mode de paiement', 'Reste dû (vente)', 'Retourné',
        ];
    }

    /** @param SaleItem $item */
    public function map($item): array
    {
        $sale = $item->sale;
        $lineTotal = (float) $item->total;
        $itemsTotal = (float) $sale->items_total;
        $paid = $itemsTotal > 0 ? round($lineTotal * (float) $sale->total / $itemsTotal, 2) : $lineTotal;

        return [
            Date::dateTimeToExcel($sale->sale_date),
            $sale->ticket_number,
            $sale->shop?->name,
            $sale->customer?->name,
            $item->product_name,
            $item->sku,
            (float) $item->quantity,
            (float) $item->unit_price,
            // Remise de ligne et part de la remise globale, TTC.
            round($item->unit_price * $item->quantity * (1 + $item->tax_rate / 100) - $paid, 2),
            $paid,
            $sale->shop?->currency,
            self::PAYMENT_METHODS[$sale->payment_method] ?? $sale->payment_method,
            (float) $sale->remaining_amount,
            $item->is_returned ? 'Oui' : 'Non',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'A' => 'dd/mm/yyyy hh:mm',
            'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'M' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [1 => ['font' => ['bold' => true]]];
    }
}
