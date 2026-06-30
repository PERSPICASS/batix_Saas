<?php

namespace App\Exports;

use App\Models\Shop;
use App\Models\Invoice;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class AnalyticsExport implements WithMultipleSheets
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;
    protected string $currency;

    public function __construct(int $shopId, string $startDate, string $endDate)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = Shop::find($shopId);
        $this->currency = $this->shop->currency ?? 'EUR';
    }

    public function sheets(): array
    {
        return [
            'Résumé' => new SummarySheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Factures' => new InvoicesDetailSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Clients' => new CustomersDetailSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Produits' => new ProductsDetailSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
        ];
    }
}

class SummarySheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
    }

    public function headings(): array
    {
        return [];
    }

    public function array(): array
    {
        $invoices = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
            ->get();

        $quotes = Quote::where('shop_id', $this->shopId)
            ->whereBetween('quote_date', [$this->startDate, $this->endDate])
            ->get();

        $symbol = $this->getCurrencySymbol();
        $paidInvoices = $invoices->where('status', 'paid');

        return [
            [''],
            ['RAPPORT ANALYTIQUE', '', '', $this->shop->name],
            ['Période', "{$this->startDate} au {$this->endDate}"],
            ['Devise', $this->shop->currency],
            [''],
            ['RÉSUMÉ FINANCIER', '', '', ''],
            ['Indicateur', 'Valeur', '', ''],
            ['', '', '', ''],
            ['FACTURES', '', '', ''],
            ['Total factures créées', count($invoices), '', ''],
            ['Montant total facturé', number_format($invoices->sum('total'), 2, ',', ' ') . ' ' . $symbol, '', ''],
            ['Factures payées', $paidInvoices->count(), '', ''],
            ['Montant payé', number_format($paidInvoices->sum('total'), 2, ',', ' ') . ' ' . $symbol, '', ''],
            ['Montant impayé', number_format($invoices->where('status', '!=', 'paid')->sum('total'), 2, ',', ' ') . ' ' . $symbol, '', ''],
            ['Montant moyen par facture', number_format($invoices->avg('total') ?? 0, 2, ',', ' ') . ' ' . $symbol, '', ''],
            [''],
            ['DEVIS', '', '', ''],
            ['Total devis créés', count($quotes), '', ''],
            ['Montant total des devis', number_format($quotes->sum('total'), 2, ',', ' ') . ' ' . $symbol, '', ''],
            ['Devis acceptés', $quotes->where('status', 'accepted')->count(), '', ''],
            ['Montant des devis acceptés', number_format($quotes->where('status', 'accepted')->sum('total'), 2, ',', ' ') . ' ' . $symbol, '', ''],
            ['Taux de conversion', $this->getConversionRate($quotes), '', ''],
            [''],
            ['STATISTIQUES', '', '', ''],
            ['Nombre de clients', Invoice::where('shop_id', $this->shopId)->whereBetween('invoice_date', [$this->startDate, $this->endDate])->distinct('customer_id')->count(), '', ''],
            ['Nombre de produits vendus', DB::table('invoice_items')->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')->where('invoices.shop_id', $this->shopId)->whereBetween('invoices.invoice_date', [$this->startDate, $this->endDate])->sum('quantity'), '', ''],
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 35, 'B' => 20, 'C' => 5, 'D' => 25];
    }

    public function styles(Worksheet $sheet)
    {
        // Header principal
        $sheet->getStyle('A2:D2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
            'alignment' => ['horizontal' => 'left', 'vertical' => 'center'],
        ]);

        // Section headers
        $sections = [6, 9, 17, 24];
        foreach ($sections as $row) {
            $sheet->getStyle("A{$row}:D{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F59E0B']],
                'alignment' => ['horizontal' => 'left', 'vertical' => 'center'],
            ]);
        }

        return [];
    }

    private function getConversionRate($quotes): string
    {
        $total = count($quotes);
        if ($total === 0) return '0%';
        $accepted = $quotes->where('status', 'accepted')->count();
        return round(($accepted / $total) * 100, 2) . '%';
    }

    private function getCurrencySymbol(): string
    {
        return match($this->shop->currency) {
            'EUR' => '€',
            'USD' => '$',
            'XOF' => 'FCFA',
            default => $this->shop->currency,
        };
    }
}

class InvoicesDetailSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
    }

    public function headings(): array
    {
        return ['N°', 'Date', 'Client', 'Sous-total', 'TVA', 'Total', 'Statut'];
    }

    public function array(): array
    {
        $invoices = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
            ->with('customer')
            ->orderByDesc('invoice_date')
            ->get();

        $symbol = $this->getCurrencySymbol();

        $data = [];
        foreach ($invoices as $invoice) {
            $data[] = [
                $invoice->invoice_number,
                $invoice->invoice_date->format('d/m/Y'),
                $invoice->customer->name,
                number_format($invoice->subtotal, 2, ',', ' ') . ' ' . $symbol,
                number_format($invoice->tax_amount, 2, ',', ' ') . ' ' . $symbol,
                number_format($invoice->total, 2, ',', ' ') . ' ' . $symbol,
                $this->getStatusLabel($invoice->status),
            ];
        }

        // Ajouter les totaux
        $data[] = [];
        $data[] = ['TOTAUX', '', '',
            number_format($invoices->sum('subtotal'), 2, ',', ' ') . ' ' . $symbol,
            number_format($invoices->sum('tax_amount'), 2, ',', ' ') . ' ' . $symbol,
            number_format($invoices->sum('total'), 2, ',', ' ') . ' ' . $symbol,
            ''
        ];

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 18, 'B' => 12, 'C' => 25, 'D' => 18, 'E' => 18, 'F' => 18, 'G' => 15];
    }

    public function styles(Worksheet $sheet)
    {
        // Header
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
            'alignment' => ['horizontal' => 'center', 'vertical' => 'center'],
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

    private function getCurrencySymbol(): string
    {
        return match($this->shop->currency) {
            'EUR' => '€',
            'USD' => '$',
            'XOF' => 'FCFA',
            default => $this->shop->currency,
        };
    }
}

class CustomersDetailSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
    }

    public function headings(): array
    {
        return ['Client', 'Factures', 'CA Total', 'Moyenne/facture', 'Dernier achat'];
    }

    public function array(): array
    {
        $customers = DB::table('invoices')
            ->where('invoices.shop_id', $this->shopId)
            ->whereBetween('invoices.invoice_date', [$this->startDate, $this->endDate])
            ->join('customers', 'invoices.customer_id', '=', 'customers.id')
            ->where('invoices.status', 'paid')
            ->groupBy('customers.id', 'customers.name')
            ->select(
                'customers.name',
                DB::raw('COUNT(invoices.id) as count'),
                DB::raw('SUM(invoices.total) as total'),
                DB::raw('AVG(invoices.total) as average'),
                DB::raw('MAX(invoices.invoice_date) as last_date')
            )
            ->orderByDesc('total')
            ->limit(50)
            ->get();

        $symbol = $this->getCurrencySymbol();

        $data = [];
        foreach ($customers as $customer) {
            $data[] = [
                $customer->name,
                $customer->count,
                number_format($customer->total, 2, ',', ' ') . ' ' . $symbol,
                number_format($customer->average, 2, ',', ' ') . ' ' . $symbol,
                $customer->last_date ? \Carbon\Carbon::parse($customer->last_date)->format('d/m/Y') : '-',
            ];
        }

        // Totaux
        $data[] = [];
        $data[] = ['TOTAUX', $customers->sum('count'),
            number_format($customers->sum('total'), 2, ',', ' ') . ' ' . $symbol,
            number_format($customers->avg('average'), 2, ',', ' ') . ' ' . $symbol,
            ''
        ];

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 25, 'B' => 12, 'C' => 18, 'D' => 18, 'E' => 15];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
        ]);

        return [];
    }

    private function getCurrencySymbol(): string
    {
        return match($this->shop->currency) {
            'EUR' => '€',
            'USD' => '$',
            'XOF' => 'FCFA',
            default => $this->shop->currency,
        };
    }
}

class ProductsDetailSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
    }

    public function headings(): array
    {
        return ['Produit', 'Quantité', 'Prix unitaire moyen', 'CA Total', '% CA'];
    }

    public function array(): array
    {
        $products = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoices.shop_id', $this->shopId)
            ->whereBetween('invoices.invoice_date', [$this->startDate, $this->endDate])
            ->groupBy('invoice_items.product_name')
            ->select(
                'invoice_items.product_name as name',
                DB::raw('SUM(invoice_items.quantity) as quantity'),
                DB::raw('AVG(invoice_items.unit_price) as avg_price'),
                DB::raw('SUM(invoice_items.quantity * invoice_items.unit_price) as total')
            )
            ->orderByDesc('total')
            ->limit(50)
            ->get();

        $symbol = $this->getCurrencySymbol();
        $totalRevenue = $products->sum('total');

        $data = [];
        foreach ($products as $product) {
            $percentage = $totalRevenue > 0 ? round(($product->total / $totalRevenue) * 100, 2) : 0;
            $data[] = [
                $product->name,
                $product->quantity,
                number_format($product->avg_price, 2, ',', ' ') . ' ' . $symbol,
                number_format($product->total, 2, ',', ' ') . ' ' . $symbol,
                $percentage . '%',
            ];
        }

        // Totaux
        $data[] = [];
        $data[] = ['TOTAUX', $products->sum('quantity'),
            '',
            number_format($totalRevenue, 2, ',', ' ') . ' ' . $symbol,
            '100%'
        ];

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 25, 'B' => 12, 'C' => 18, 'D' => 18, 'E' => 12];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
        ]);

        return [];
    }

    private function getCurrencySymbol(): string
    {
        return match($this->shop->currency) {
            'EUR' => '€',
            'USD' => '$',
            'XOF' => 'FCFA',
            default => $this->shop->currency,
        };
    }
}
