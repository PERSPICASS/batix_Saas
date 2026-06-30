<?php

namespace App\Exports;

use App\Models\Invoice;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AnalyticsExport implements WithMultipleSheets
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;

    public function __construct(int $shopId, string $startDate, string $endDate)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function sheets(): array
    {
        return [
            'Résumé' => new SummarySheet($this->shopId, $this->startDate, $this->endDate),
            'Chiffre d\'affaires' => new RevenueSheet($this->shopId, $this->startDate, $this->endDate),
            'Clients' => new CustomersSheet($this->shopId, $this->startDate, $this->endDate),
            'Produits' => new ProductsSheet($this->shopId, $this->startDate, $this->endDate),
        ];
    }
}

class SummarySheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;

    public function __construct(int $shopId, string $startDate, string $endDate)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function headings(): array
    {
        return ['Indicateur', 'Valeur'];
    }

    public function array(): array
    {
        $invoices = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
            ->get();

        $quotes = Quote::where('shop_id', $this->shopId)
            ->whereBetween('quote_date', [$this->startDate, $this->endDate])
            ->get();

        return [
            ['Période', "{$this->startDate} au {$this->endDate}"],
            [],
            ['FACTURES', ''],
            ['Total factures', count($invoices)],
            ['CA Factures', number_format($invoices->sum('total'), 2, ',', ' ') . ' €'],
            ['Factures payées', $invoices->where('status', 'paid')->count()],
            ['CA Payé', number_format($invoices->where('status', 'paid')->sum('total'), 2, ',', ' ') . ' €'],
            [],
            ['DEVIS', ''],
            ['Total devis', count($quotes)],
            ['Montant devis', number_format($quotes->sum('total'), 2, ',', ' ') . ' €'],
            ['Devis acceptés', $quotes->where('status', 'accepted')->count()],
            ['Taux de conversion', $this->getConversionRate($quotes)],
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 25, 'B' => 25];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
        ]);

        return [];
    }

    private function getConversionRate(mixed $quotes): string
    {
        $total = count($quotes);
        if ($total === 0) return '0%';
        $accepted = $quotes->where('status', 'accepted')->count();
        return round(($accepted / $total) * 100, 2) . '%';
    }
}

class RevenueSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;

    public function __construct(int $shopId, string $startDate, string $endDate)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function headings(): array
    {
        return ['Statut', 'Nombre', 'Sous-total', 'TVA', 'Total moyen', 'Total'];
    }

    public function array(): array
    {
        $statuses = ['draft' => 'Brouillon', 'sent' => 'Envoyée', 'paid' => 'Payée', 'overdue' => 'En retard'];

        $data = [];
        foreach ($statuses as $status => $label) {
            $invoices = Invoice::where('shop_id', $this->shopId)
                ->where('status', $status)
                ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
                ->get();

            if (count($invoices) > 0) {
                $data[] = [
                    $label,
                    count($invoices),
                    number_format($invoices->sum('subtotal'), 2, ',', ' '),
                    number_format($invoices->sum('tax_amount'), 2, ',', ' '),
                    number_format($invoices->avg('total'), 2, ',', ' '),
                    number_format($invoices->sum('total'), 2, ',', ' '),
                ];
            }
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 15, 'B' => 12, 'C' => 15, 'D' => 15, 'E' => 15, 'F' => 15];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
        ]);

        return [];
    }
}

class CustomersSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;

    public function __construct(int $shopId, string $startDate, string $endDate)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function headings(): array
    {
        return ['Client', 'Factures', 'CA Total', 'Moyenne par facture', 'Dernier achat'];
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

        return $customers->map(function ($customer) {
            return [
                $customer->name,
                $customer->count,
                number_format($customer->total, 2, ',', ' '),
                number_format($customer->average, 2, ',', ' '),
                $customer->last_date ? \Carbon\Carbon::parse($customer->last_date)->format('d/m/Y') : '-',
            ];
        })->toArray();
    }

    public function columnWidths(): array
    {
        return ['A' => 25, 'B' => 12, 'C' => 15, 'D' => 18, 'E' => 15];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
        ]);

        return [];
    }
}

class ProductsSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;

    public function __construct(int $shopId, string $startDate, string $endDate)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function headings(): array
    {
        return ['Produit', 'Quantité', 'Prix unitaire moyen', 'CA Total'];
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

        return $products->map(function ($product) {
            return [
                $product->name,
                $product->quantity,
                number_format($product->avg_price, 2, ',', ' '),
                number_format($product->total, 2, ',', ' '),
            ];
        })->toArray();
    }

    public function columnWidths(): array
    {
        return ['A' => 25, 'B' => 12, 'C' => 18, 'D' => 15];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
        ]);

        return [];
    }
}
