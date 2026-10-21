<?php

namespace App\Exports;

use App\Exports\Concerns\SanitizesFormulaInjection;
use App\Models\Shop;
use App\Models\Invoice;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\PatternFill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Carbon\Carbon;

class ProfessionalAnalyticsExport implements WithMultipleSheets
{
    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;
    protected string $currency;
    protected string $symbol;
    protected Carbon $periodStart;
    protected Carbon $periodEnd;

    public function __construct(int $shopId, string $startDate, string $endDate)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->periodStart = Carbon::parse($startDate);
        $this->periodEnd = Carbon::parse($endDate);
        $this->shop = Shop::find($shopId);
        $this->currency = $this->shop->currency ?? 'EUR';
        $this->symbol = $this->getCurrencySymbol();
    }

    public function sheets(): array
    {
        return [
            'Dashboard' => new DashboardSheet($this->shopId, $this->startDate, $this->endDate, $this->shop, $this->symbol),
            'Tendances' => new TrendSheet($this->shopId, $this->startDate, $this->endDate, $this->shop, $this->symbol),
            'Clients' => new ClientsAnalysisSheet($this->shopId, $this->startDate, $this->endDate, $this->shop, $this->symbol),
            'Produits' => new ProductsAnalysisSheet($this->shopId, $this->startDate, $this->endDate, $this->shop, $this->symbol),
            'Performance' => new PerformanceSheet($this->shopId, $this->startDate, $this->endDate, $this->shop, $this->symbol),
            'Alertes' => new AlertsSheet($this->shopId, $this->startDate, $this->endDate, $this->shop, $this->symbol),
        ];
    }

    private function getCurrencySymbol(): string
    {
        return match($this->currency) {
            'EUR' => '€',
            'USD' => '$',
            'XOF' => 'FCFA',
            default => $this->currency,
        };
    }
}

// SHEET 1: DASHBOARD
class DashboardSheet implements FromArray, WithColumnWidths, WithStyles, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;
    protected string $symbol;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop, string $symbol)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
        $this->symbol = $symbol;
    }

    public function array(): array
    {
        $invoices = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
            ->get();

        $quotes = Quote::where('shop_id', $this->shopId)
            ->whereBetween('quote_date', [$this->startDate, $this->endDate])
            ->get();

        $paidInvoices = $invoices->where('status', 'paid');
        $prevPeriodInvoices = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [
                Carbon::parse($this->startDate)->subDays(Carbon::parse($this->endDate)->diffInDays(Carbon::parse($this->startDate))),
                Carbon::parse($this->startDate)->subDay()
            ])
            ->get();

        $totalCA = $invoices->sum('total');
        $prevTotalCA = $prevPeriodInvoices->sum('total');
        $growth = $prevTotalCA > 0 ? (($totalCA - $prevTotalCA) / $prevTotalCA * 100) : 0;

        return [
            ['RAPPORT ANALYTIQUE COMPLET', '', '', ''],
            [$this->shop->name, '', '', ''],
            ['Période: ' . $this->startDate . ' au ' . $this->endDate, '', '', ''],
            ['Devise: ' . $this->shop->currency, '', '', ''],
            [],
            ['KPI CLÉS', '', '', ''],
            [],
            ['Indicateur', 'Valeur', 'Var. %', 'vs Période Précédente'],
            [],
            ['CA Total', $totalCA . ' ' . $this->symbol, round($growth, 2) . '%', $growth > 0 ? '📈 En hausse' : '📉 En baisse'],
            ['CA Payé', $paidInvoices->sum('total') . ' ' . $this->symbol, '', ''],
            ['CA Impayé', ($invoices->where('status', '!=', 'paid')->sum('total')) . ' ' . $this->symbol, '', 'À suivre'],
            ['Factures créées', count($invoices), '', ''],
            ['Panier moyen', number_format($invoices->avg('total') ?? 0, 2) . ' ' . $this->symbol, '', ''],
            ['Taux de paiement', round(($paidInvoices->count() / count($invoices) * 100), 2) . '%', '', ''],
            [],
            ['DEVIS & CONVERSION', '', '', ''],
            [],
            ['Devis créés', count($quotes), '', ''],
            ['Devis acceptés', $quotes->where('status', 'accepted')->count(), '', ''],
            ['Taux de conversion', round(($quotes->where('status', 'accepted')->count() / count($quotes) * 100 ?? 0), 2) . '%', '', ''],
            ['Montant potentiel', number_format($quotes->where('status', 'accepted')->sum('total'), 2) . ' ' . $this->symbol, '', ''],
            [],
            ['STATISTIQUES', '', '', ''],
            [],
            ['Clients actifs', Invoice::where('shop_id', $this->shopId)->whereBetween('invoice_date', [$this->startDate, $this->endDate])->distinct('customer_id')->count(), '', ''],
            ['Produits vendus', DB::table('invoice_items')->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')->where('invoices.shop_id', $this->shopId)->whereBetween('invoices.invoice_date', [$this->startDate, $this->endDate])->sum('quantity'), '', ''],
            ['Produits différents', DB::table('invoice_items')->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')->where('invoices.shop_id', $this->shopId)->whereBetween('invoices.invoice_date', [$this->startDate, $this->endDate])->distinct('product_name')->count(), '', ''],
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 30, 'B' => 25, 'C' => 15, 'D' => 30];
    }

    public function styles(Worksheet $sheet)
    {
        // Titre principal
        $sheet->getStyle('A1:D1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 18, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1F2937']],
        ]);

        // Section headers
        $sheet->getStyle('A6:D6')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F59E0B']],
        ]);

        $sheet->getStyle('A17:D17')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F59E0B']],
        ]);

        $sheet->getStyle('A24:D24')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F59E0B']],
        ]);

        // Headers des tableaux
        $headers = [8, 18, 25];
        foreach ($headers as $row) {
            $sheet->getStyle("A{$row}:D{$row}")->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '374151']],
            ]);
        }

        return [];
    }
}

// SHEET 2: TENDANCES
class TrendSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;
    protected string $symbol;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop, string $symbol)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
        $this->symbol = $symbol;
    }

    public function headings(): array
    {
        return ['Mois', 'Factures', 'CA Total', 'CA Payé', '% Payé', 'Croissance %'];
    }

    public function array(): array
    {
        $start = Carbon::parse($this->startDate);
        $end = Carbon::parse($this->endDate);
        $prevCA = 0;
        $data = [];

        for ($date = $start; $date <= $end; $date->addMonth()) {
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();

            if ($monthEnd > $end) {
                $monthEnd = $end;
            }

            $monthInvoices = Invoice::where('shop_id', $this->shopId)
                ->whereBetween('invoice_date', [$monthStart, $monthEnd])
                ->get();

            $monthCA = $monthInvoices->sum('total');
            $monthPaid = $monthInvoices->where('status', 'paid')->sum('total');
            $paidPercent = count($monthInvoices) > 0 ? round(($monthPaid / $monthCA * 100), 2) : 0;
            $growth = $prevCA > 0 ? round((($monthCA - $prevCA) / $prevCA * 100), 2) : 0;

            $data[] = [
                $date->format('M Y'),
                count($monthInvoices),
                number_format($monthCA, 2, ',', ' ') . ' ' . $this->symbol,
                number_format($monthPaid, 2, ',', ' ') . ' ' . $this->symbol,
                $paidPercent . '%',
                $growth . '%',
            ];

            $prevCA = $monthCA;
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 15, 'B' => 12, 'C' => 20, 'D' => 20, 'E' => 12, 'F' => 15];
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

// SHEET 3: CLIENTS ANALYSE
class ClientsAnalysisSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;
    protected string $symbol;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop, string $symbol)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
        $this->symbol = $symbol;
    }

    public function headings(): array
    {
        return ['Rang', 'Client', 'Factures', 'CA Total', 'Panier Moyen', 'Dernier Achat', 'Catégorie'];
    }

    public function array(): array
    {
        $clients = DB::table('invoices')
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
            ->get();

        $totalCA = $clients->sum('total');
        $data = [];
        $rank = 1;

        foreach ($clients as $client) {
            $percentage = round(($client->total / $totalCA * 100), 2);
            $category = $percentage > 20 ? '⭐ VIP' : ($client->count >= 5 ? '🔄 Loyal' : '🌟 Nouveau');

            $data[] = [
                $rank++,
                $client->name,
                $client->count,
                number_format($client->total, 2, ',', ' ') . ' ' . $this->symbol,
                number_format($client->average, 2, ',', ' ') . ' ' . $this->symbol,
                Carbon::parse($client->last_date)->format('d/m/Y'),
                $category . ' (' . $percentage . '%)',
            ];
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 8, 'B' => 25, 'C' => 12, 'D' => 20, 'E' => 18, 'F' => 15, 'G' => 20];
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

// SHEET 4: PRODUITS ANALYSE
class ProductsAnalysisSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;
    protected string $symbol;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop, string $symbol)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
        $this->symbol = $symbol;
    }

    public function headings(): array
    {
        return ['Rang', 'Produit', 'Quantité', 'Prix Moyen', 'CA Total', '% CA', 'Catégorie ABC'];
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
            ->get();

        $totalCA = $products->sum('total');
        $cumulativeCA = 0;
        $data = [];
        $rank = 1;

        foreach ($products as $product) {
            $percentage = round(($product->total / $totalCA * 100), 2);
            $cumulativeCA += $percentage;

            if ($cumulativeCA <= 80) {
                $category = 'A 🔴 Stars';
            } elseif ($cumulativeCA <= 95) {
                $category = 'B 🟡 Important';
            } else {
                $category = 'C 🟢 Faible';
            }

            $data[] = [
                $rank++,
                $product->name,
                $product->quantity,
                number_format($product->avg_price, 2, ',', ' ') . ' ' . $this->symbol,
                number_format($product->total, 2, ',', ' ') . ' ' . $this->symbol,
                $percentage . '%',
                $category,
            ];

            if ($rank > 50) break;
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 8, 'B' => 25, 'C' => 12, 'D' => 15, 'E' => 20, 'F' => 10, 'G' => 18];
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

// SHEET 5: PERFORMANCE
class PerformanceSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;
    protected string $symbol;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop, string $symbol)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
        $this->symbol = $symbol;
    }

    public function headings(): array
    {
        return ['Statut', 'Nombre', 'CA Total', '% Total', 'Délai Moyen (jours)'];
    }

    public function array(): array
    {
        $invoices = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
            ->get();

        $totalCA = $invoices->sum('total');
        $statuses = ['draft' => 'Brouillon', 'sent' => 'Envoyée', 'paid' => 'Payée', 'overdue' => 'En retard', 'cancelled' => 'Annulée'];

        $data = [];

        foreach ($statuses as $status => $label) {
            $statusInvoices = $invoices->where('status', $status);
            $count = count($statusInvoices);

            if ($count > 0) {
                $ca = $statusInvoices->sum('total');
                $percentage = round(($ca / $totalCA * 100), 2);

                // Calcul délai moyen
                $delayDays = 0;
                foreach ($statusInvoices as $invoice) {
                    if ($invoice->due_date) {
                        $delayDays += abs($invoice->due_date->diffInDays(now()));
                    }
                }
                $delayDays = $count > 0 ? round($delayDays / $count, 1) : 0;

                $data[] = [
                    $label,
                    $count,
                    number_format($ca, 2, ',', ' ') . ' ' . $this->symbol,
                    $percentage . '%',
                    $delayDays . ' jours',
                ];
            }
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 15, 'B' => 12, 'C' => 20, 'D' => 12, 'E' => 20];
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

// SHEET 6: ALERTES
class AlertsSheet implements FromArray, WithColumnWidths, WithStyles, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    protected int $shopId;
    protected string $startDate;
    protected string $endDate;
    protected Shop $shop;
    protected string $symbol;

    public function __construct(int $shopId, string $startDate, string $endDate, Shop $shop, string $symbol)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->shop = $shop;
        $this->symbol = $symbol;
    }

    public function array(): array
    {
        $alerts = [];

        // Alerte 1: Factures impayées
        $unpaid = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
            ->where('status', '!=', 'paid')
            ->get();

        if (count($unpaid) > 0) {
            $alerts[] = ['⚠️ ALERTE PAIEMENT', '', ''];
            $alerts[] = ['Factures impayées', count($unpaid), number_format($unpaid->sum('total'), 2) . ' ' . $this->symbol];
            $alerts[] = [];
        }

        // Alerte 2: Taux de conversion faible
        $quotes = Quote::where('shop_id', $this->shopId)
            ->whereBetween('quote_date', [$this->startDate, $this->endDate])
            ->get();

        $conversionRate = count($quotes) > 0 ? ($quotes->where('status', 'accepted')->count() / count($quotes) * 100) : 0;
        if ($conversionRate < 30 && count($quotes) > 5) {
            $alerts[] = ['⚠️ ALERTE CONVERSION', '', ''];
            $alerts[] = ['Taux de conversion faible', round($conversionRate, 2) . '%', 'Objectif: 30%+'];
            $alerts[] = [];
        }

        // Alerte 3: Concentration clients
        $topClients = DB::table('invoices')
            ->where('invoices.shop_id', $this->shopId)
            ->whereBetween('invoices.invoice_date', [$this->startDate, $this->endDate])
            ->join('customers', 'invoices.customer_id', '=', 'customers.id')
            ->groupBy('customers.id')
            ->select(DB::raw('SUM(invoices.total) as total'))
            ->orderByDesc('total')
            ->limit(3)
            ->get();

        $totalCA = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
            ->sum('total');

        $topClientsCA = $topClients->sum('total');
        $concentration = $totalCA > 0 ? ($topClientsCA / $totalCA * 100) : 0;

        if ($concentration > 60) {
            $alerts[] = ['⚠️ ALERTE CONCENTRATION', '', ''];
            $alerts[] = ['Top 3 clients = ' . round($concentration, 2) . '% du CA', 'Risque de dépendance', 'Diversifier'];
            $alerts[] = [];
        }

        // Alerte 4: Produits en baisse
        $alerts[] = ['✅ SITUATION GLOBALE', '', ''];
        $alerts[] = ['Factures créées', count($unpaid->where('status', '!=', 'draft')) . ' factures', ''];
        $alerts[] = ['Taux de paiement', round((Invoice::where('shop_id', $this->shopId)->whereBetween('invoice_date', [$this->startDate, $this->endDate])->where('status', 'paid')->count() / count(Invoice::where('shop_id', $this->shopId)->whereBetween('invoice_date', [$this->startDate, $this->endDate])->get()) * 100), 2) . '%', ''];

        if (empty($alerts)) {
            $alerts[] = ['✨ Pas d\'alertes', '', ''];
            $alerts[] = ['Tout va bien! 🎉', '', ''];
        }

        return $alerts;
    }

    public function columnWidths(): array
    {
        return ['A' => 35, 'B' => 25, 'C' => 25];
    }

    public function styles(Worksheet $sheet)
    {
        return [];
    }
}
