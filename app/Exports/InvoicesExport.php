<?php

namespace App\Exports;

use App\Models\Invoice;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\PatternFill;

class InvoicesExport implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;

    public function __construct(int $shopId)
    {
        $this->shopId = $shopId;
    }

    public function headings(): array
    {
        return [
            'N° Facture',
            'Date',
            'Échéance',
            'Client',
            'Sous-total',
            'TVA',
            'Total',
            'Statut',
            'Méthode de paiement',
        ];
    }

    public function array(): array
    {
        $invoices = Invoice::where('shop_id', $this->shopId)
            ->with('customer')
            ->orderByDesc('invoice_date')
            ->get();

        return $invoices->map(function ($invoice) {
            return [
                $invoice->invoice_number,
                $invoice->invoice_date->format('d/m/Y'),
                $invoice->due_date?->format('d/m/Y') ?? '-',
                $invoice->customer->name,
                number_format($invoice->subtotal, 2, ',', ' '),
                number_format($invoice->tax_amount, 2, ',', ' '),
                number_format($invoice->total, 2, ',', ' '),
                $this->getStatusLabel($invoice->status),
                $invoice->payment_method ?? '-',
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
            'I' => 18,
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
            'sent' => 'Envoyée',
            'paid' => 'Payée',
            'overdue' => 'En retard',
            'cancelled' => 'Annulée',
            default => $status,
        };
    }
}
