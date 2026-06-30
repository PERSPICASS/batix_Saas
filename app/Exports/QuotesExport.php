<?php

namespace App\Exports;

use App\Models\Quote;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\PatternFill;

class QuotesExport implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;

    public function __construct(int $shopId)
    {
        $this->shopId = $shopId;
    }

    public function headings(): array
    {
        return [
            'N° Devis',
            'Date',
            'Expiration',
            'Client',
            'Sous-total',
            'TVA',
            'Total',
            'Statut',
        ];
    }

    public function array(): array
    {
        $quotes = Quote::where('shop_id', $this->shopId)
            ->with('customer')
            ->orderByDesc('quote_date')
            ->get();

        return $quotes->map(function ($quote) {
            return [
                $quote->quote_number,
                $quote->quote_date->format('d/m/Y'),
                $quote->expiry_date->format('d/m/Y'),
                $quote->customer->name,
                number_format($quote->subtotal, 2, ',', ' '),
                number_format($quote->tax_amount, 2, ',', ' '),
                number_format($quote->total, 2, ',', ' '),
                $this->getStatusLabel($quote->status),
            ];
        })->toArray();
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,
            'B' => 12,
            'C' => 12,
            'D' => 25,
            'E' => 15,
            'F' => 15,
            'G' => 15,
            'H' => 12,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => PatternFill::FILL_SOLID,
                'startColor' => ['rgb' => '1F2937'],
            ],
        ]);

        return [];
    }

    private function getStatusLabel(string $status): string
    {
        return match($status) {
            'draft' => 'Brouillon',
            'sent' => 'Envoyé',
            'accepted' => 'Accepté',
            'expired' => 'Expiré',
            'rejected' => 'Rejeté',
            default => $status,
        };
    }
}
