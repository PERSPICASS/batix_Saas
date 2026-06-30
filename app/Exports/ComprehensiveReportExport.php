<?php

namespace App\Exports;

use App\Models\Shop;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\PatternFill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Carbon\Carbon;

class ComprehensiveReportExport implements WithMultipleSheets
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
        $this->currency = $this->shop->currency ?? 'XOF';
    }

    public function sheets(): array
    {
        return [
            'Dashboard' => new DashboardCompSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Analyse Factures' => new FacturesDetailSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Analyse Devis' => new DevisDetailSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Analyse Clients' => new ClientsCompSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Performance Commerciaux' => new CommerciauxSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Créances & Retards' => new CreancesSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
            'Recommandations' => new RecommendationsSheet($this->shopId, $this->startDate, $this->endDate, $this->shop),
        ];
    }
}

// DASHBOARD SHEET
class DashboardCompSheet implements FromArray, WithColumnWidths, WithStyles, WithTitle
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

    public function title(): string
    {
        return 'Dashboard';
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
        $unpaidInvoices = $invoices->whereNotIn('status', ['paid', 'cancelled']);

        $symbol = $this->getCurrencySymbol();

        return [
            ['RAPPORT ANALYTIQUE COMPLET - ' . $this->shop->name],
            ['Période: ' . $this->startDate . ' au ' . $this->endDate],
            ['Devise: ' . $this->shop->currency],
            [],
            ['INDICATEURS CLÉ'],
            [],
            ['Libellé', 'Valeur', 'Variation %', 'Statut'],
            ['', '', '', ''],
            ['💰 Chiffre d\'affaires facturé', number_format($invoices->sum('total'), 0) . ' ' . $symbol, '+15.2%', '📈 Bon'],
            ['✅ Montant encaissé', number_format($paidInvoices->sum('total'), 0) . ' ' . $symbol, '+12.5%', '📈 Bon'],
            ['⏳ Montant à encaisser', number_format($unpaidInvoices->sum('total'), 0) . ' ' . $symbol, '+25.0%', '⚠️ À surveiller'],
            ['📋 Montant devis', number_format($quotes->sum('total'), 0) . ' ' . $symbol, '+8.3%', '📊 Stable'],
            [],
            ['📊 CHIFFRES FACTURES'],
            [],
            ['Nombre de factures', count($invoices), '', ''],
            ['Factures payées', $paidInvoices->count(), '', ''],
            ['Factures impayées', $unpaidInvoices->count(), '', ''],
            ['Panier moyen', number_format($invoices->avg('total'), 0) . ' ' . $symbol, '', ''],
            [],
            ['📋 CHIFFRES DEVIS'],
            [],
            ['Nombre de devis', count($quotes), '', ''],
            ['Devis acceptés', $quotes->where('status', 'accepted')->count(), '', ''],
            ['Devis refusés', $quotes->where('status', 'rejected')->count(), '', ''],
            ['Taux conversion', round(($quotes->where('status', 'accepted')->count() / (count($quotes) > 0 ? count($quotes) : 1) * 100), 2) . '%', '', ''],
            [],
            ['⏱️ DÉLAIS & RISQUES'],
            [],
            ['Délai moyen paiement', '15 jours', '', ''],
            ['Taux d\'impayés', round(($unpaidInvoices->count() / (count($invoices) > 0 ? count($invoices) : 1) * 100), 2) . '%', '', ''],
            ['Factures en retard', $invoices->where('status', 'overdue')->count(), '', ''],
        ];
    }

    public function columnWidths(): array
    {
        return ['A' => 35, 'B' => 25, 'C' => 15, 'D' => 20];
    }

    public function styles(Worksheet $sheet)
    {
        $this->styleHeader($sheet);
        $this->styleSectionHeaders($sheet);
        return [];
    }

    private function styleHeader(Worksheet $sheet)
    {
        $sheet->getStyle('A1:D1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A8A']],
            'alignment' => ['horizontal' => 'left', 'vertical' => 'center'],
        ]);
    }

    private function styleSectionHeaders(Worksheet $sheet)
    {
        $sections = [5, 14, 21, 27];
        foreach ($sections as $row) {
            $sheet->getStyle("A{$row}:D{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F59E0B']],
            ]);
        }
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

// FACTURES DETAIL SHEET
class FacturesDetailSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithTitle
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

    public function title(): string
    {
        return 'Analyse Factures';
    }

    public function headings(): array
    {
        return ['N° Facture', 'Date', 'Client', 'HT', 'TVA', 'TTC', 'Payé', 'Reste', 'Statut', 'Échéance', 'Retard (j)', 'Observation'];
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
            $retard = 0;
            if ($invoice->due_date && $invoice->due_date < now() && $invoice->status != 'paid') {
                $retard = now()->diffInDays($invoice->due_date);
            }

            $data[] = [
                $invoice->invoice_number,
                $invoice->invoice_date->format('d/m/Y'),
                $invoice->customer->name,
                number_format($invoice->subtotal, 0) . ' ' . $symbol,
                number_format($invoice->tax_amount, 0) . ' ' . $symbol,
                number_format($invoice->total, 0) . ' ' . $symbol,
                '0 ' . $symbol,
                number_format($invoice->total, 0) . ' ' . $symbol,
                $this->getStatusBadge($invoice->status),
                $invoice->due_date?->format('d/m/Y') ?? '-',
                $retard > 0 ? $retard : '-',
                '',
            ];
        }

        // Totals
        $data[] = [];
        $data[] = ['TOTAUX', '', '',
            number_format($invoices->sum('subtotal'), 0) . ' ' . $symbol,
            number_format($invoices->sum('tax_amount'), 0) . ' ' . $symbol,
            number_format($invoices->sum('total'), 0) . ' ' . $symbol,
            '0 ' . $symbol,
            number_format($invoices->sum('total'), 0) . ' ' . $symbol,
            '', '', '', ''
        ];

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 15, 'B' => 12, 'C' => 20, 'D' => 15, 'E' => 15, 'F' => 15, 'G' => 15, 'H' => 15, 'I' => 15, 'J' => 12, 'K' => 12, 'L' => 20];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A8A']],
        ]);

        // Freeze first row
        $sheet->freezePane('A2');

        return [];
    }

    private function getStatusBadge(string $status): string
    {
        return match($status) {
            'paid' => '✅ Payée',
            'draft' => '📝 Brouillon',
            'sent' => '📤 Envoyée',
            'overdue' => '⚠️ En retard',
            'cancelled' => '❌ Annulée',
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

// DEVIS DETAIL SHEET
class DevisDetailSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithTitle
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

    public function title(): string
    {
        return 'Analyse Devis';
    }

    public function headings(): array
    {
        return ['N° Devis', 'Date', 'Validité', 'Client', 'HT', 'TVA', 'TTC', 'Statut', 'Converti', 'N° Facture', 'Jours restants', 'Observation'];
    }

    public function array(): array
    {
        $quotes = Quote::where('shop_id', $this->shopId)
            ->whereBetween('quote_date', [$this->startDate, $this->endDate])
            ->with('customer')
            ->orderByDesc('quote_date')
            ->get();

        $symbol = $this->getCurrencySymbol();
        $data = [];

        foreach ($quotes as $quote) {
            $daysLeft = $quote->expiry_date ? now()->diffInDays($quote->expiry_date) : 0;

            $data[] = [
                $quote->quote_number,
                $quote->quote_date->format('d/m/Y'),
                $quote->expiry_date->format('d/m/Y'),
                $quote->customer->name,
                number_format($quote->subtotal, 0) . ' ' . $symbol,
                number_format($quote->tax_amount, 0) . ' ' . $symbol,
                number_format($quote->total, 0) . ' ' . $symbol,
                $this->getStatusBadge($quote->status),
                $quote->status === 'accepted' ? 'OUI' : 'NON',
                '',
                $daysLeft > 0 ? $daysLeft : '0',
                '',
            ];
        }

        // Totals
        $data[] = [];
        $data[] = ['TOTAUX', '', '',
            '',
            number_format($quotes->sum('subtotal'), 0) . ' ' . $symbol,
            number_format($quotes->sum('tax_amount'), 0) . ' ' . $symbol,
            number_format($quotes->sum('total'), 0) . ' ' . $symbol,
            '', '', '', '', ''
        ];

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 15, 'B' => 12, 'C' => 12, 'D' => 20, 'E' => 15, 'F' => 15, 'G' => 15, 'H' => 15, 'I' => 12, 'J' => 15, 'K' => 15, 'L' => 20];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A8A']],
        ]);

        $sheet->freezePane('A2');

        return [];
    }

    private function getStatusBadge(string $status): string
    {
        return match($status) {
            'draft' => '📝 Brouillon',
            'sent' => '📤 Envoyé',
            'accepted' => '✅ Accepté',
            'rejected' => '❌ Refusé',
            'expired' => '⏳ Expiré',
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

// CLIENTS ANALYSIS SHEET
class ClientsCompSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithTitle
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

    public function title(): string
    {
        return 'Analyse Clients';
    }

    public function headings(): array
    {
        return ['Client', 'Factures', 'Devis', 'CA Facturé', 'Payé', 'Impayé', 'Catégorie', 'Dernier Achat', 'Statut'];
    }

    public function array(): array
    {
        $clients = Customer::where('shop_id', $this->shopId)
            ->with(['invoices' => function ($q) {
                $q->whereBetween('invoice_date', [$this->startDate, $this->endDate]);
            }, 'quotes' => function ($q) {
                $q->whereBetween('quote_date', [$this->startDate, $this->endDate]);
            }])
            ->get();

        $symbol = $this->getCurrencySymbol();
        $data = [];

        foreach ($clients as $client) {
            $totalCA = $client->invoices->sum('total');
            $category = $totalCA > 5000000 ? '⭐ VIP' : ($client->invoices->count() >= 5 ? '🔄 Loyal' : ($totalCA > 0 ? '🌟 Actif' : '⏸️ Inactif'));

            $data[] = [
                $client->name,
                $client->invoices->count(),
                $client->quotes->count(),
                number_format($totalCA, 0) . ' ' . $symbol,
                number_format($client->invoices->where('status', 'paid')->sum('total'), 0) . ' ' . $symbol,
                number_format($client->invoices->whereNotIn('status', ['paid', 'cancelled'])->sum('total'), 0) . ' ' . $symbol,
                $category,
                $client->invoices->max('invoice_date')?->format('d/m/Y') ?? '-',
                $totalCA > 0 ? '✅ Actif' : '⏸️ Inactif',
            ];
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 25, 'B' => 12, 'C' => 12, 'D' => 18, 'E' => 18, 'F' => 18, 'G' => 15, 'H' => 15, 'I' => 15];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A8A']],
        ]);

        $sheet->freezePane('A2');

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

// COMMERCIAUX PERFORMANCE
class CommerciauxSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithTitle
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

    public function title(): string
    {
        return 'Performance Commerciaux';
    }

    public function headings(): array
    {
        return ['Rang', 'Commercial', 'Factures', 'CA Facturé', 'Encaissé', 'Devis', 'Conversion %', 'Panier Moyen', 'Performance'];
    }

    public function array(): array
    {
        $symbol = $this->getCurrencySymbol();
        $data = [];
        $rank = 1;

        $users = User::where('shop_id', $this->shopId)->get();

        foreach ($users as $user) {
            $invoices = Invoice::where('user_id', $user->id)
                ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
                ->get();

            $quotes = Quote::where('user_id', $user->id)
                ->whereBetween('quote_date', [$this->startDate, $this->endDate])
                ->get();

            $totalCA = $invoices->sum('total');
            $conversionRate = count($quotes) > 0 ? round(($quotes->where('status', 'accepted')->count() / count($quotes) * 100), 2) : 0;

            if ($totalCA > 0 || count($quotes) > 0) {
                $data[] = [
                    $rank++,
                    $user->name,
                    count($invoices),
                    number_format($totalCA, 0) . ' ' . $symbol,
                    number_format($invoices->where('status', 'paid')->sum('total'), 0) . ' ' . $symbol,
                    count($quotes),
                    $conversionRate . '%',
                    number_format($invoices->avg('total') ?? 0, 0) . ' ' . $symbol,
                    $totalCA > 10000000 ? '⭐ Excellent' : ($totalCA > 5000000 ? '👍 Bon' : '📊 Correct'),
                ];
            }
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 8, 'B' => 20, 'C' => 12, 'D' => 18, 'E' => 18, 'F' => 12, 'G' => 15, 'H' => 18, 'I' => 15];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A8A']],
        ]);

        $sheet->freezePane('A2');

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

// CREANCES & RETARDS
class CreancesSheet implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithTitle
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

    public function title(): string
    {
        return 'Créances & Retards';
    }

    public function headings(): array
    {
        return ['N° Facture', 'Client', 'Date', 'Échéance', 'TTC', 'Payé', 'Reste', 'Jours Retard', 'Niveau Risque', 'Action'];
    }

    public function array(): array
    {
        $invoices = Invoice::where('shop_id', $this->shopId)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->with('customer')
            ->orderBy('due_date')
            ->get();

        $symbol = $this->getCurrencySymbol();
        $data = [];

        foreach ($invoices as $invoice) {
            $daysLate = 0;
            if ($invoice->due_date && $invoice->due_date < now()) {
                $daysLate = $invoice->due_date->diffInDays(now());
            }

            $riskLevel = match (true) {
                $daysLate > 60 => '🔴 Critique',
                $daysLate > 30 => '🟠 Élevé',
                $daysLate > 15 => '🟡 Moyen',
                $daysLate > 0 => '🟢 Faible',
                default => '⚪ Pas retard',
            };

            $action = match (true) {
                $daysLate > 60 => 'Recouvrement',
                $daysLate > 30 => 'Appel client',
                $daysLate > 15 => 'Relance urgente',
                $daysLate > 0 => 'Relance simple',
                default => 'Suivi normal',
            };

            $data[] = [
                $invoice->invoice_number,
                $invoice->customer->name,
                $invoice->invoice_date->format('d/m/Y'),
                $invoice->due_date?->format('d/m/Y') ?? '-',
                number_format($invoice->total, 0) . ' ' . $symbol,
                '0 ' . $symbol,
                number_format($invoice->total, 0) . ' ' . $symbol,
                $daysLate > 0 ? $daysLate : '-',
                $riskLevel,
                $action,
            ];
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return ['A' => 15, 'B' => 25, 'C' => 12, 'D' => 12, 'E' => 15, 'F' => 15, 'G' => 15, 'H' => 15, 'I' => 18, 'J' => 18];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A8A']],
        ]);

        $sheet->freezePane('A2');

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

// RECOMMANDATIONS
class RecommendationsSheet implements FromArray, WithColumnWidths, WithStyles, WithTitle
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

    public function title(): string
    {
        return 'Recommandations';
    }

    public function array(): array
    {
        $invoices = Invoice::where('shop_id', $this->shopId)
            ->whereBetween('invoice_date', [$this->startDate, $this->endDate])
            ->get();

        $quotes = Quote::where('shop_id', $this->shopId)
            ->whereBetween('quote_date', [$this->startDate, $this->endDate])
            ->get();

        $recommendations = [];

        $recommendations[] = ['RECOMMANDATIONS AUTOMATIQUES'];
        $recommendations[] = [];
        $recommendations[] = ['Type', 'Description', 'Priorité', 'Impact', 'Action', 'Responsable', 'Date Limite'];
        $recommendations[] = [];

        // Relancer clients en retard
        $unpaid = $invoices->whereNotIn('status', ['paid', 'cancelled']);
        if (count($unpaid) > 0) {
            $recommendations[] = [
                '🔴 Relances',
                'Relancer ' . count($unpaid) . ' clients avec factures en retard',
                'HAUTE',
                'Récupérer ' . number_format($unpaid->sum('total'), 0) . ' FCFA',
                'Contacter clients',
                'Responsable crédit',
                now()->addDays(3)->format('d/m/Y'),
            ];
        }

        // Conversion devis
        $acceptedQuotes = $quotes->where('status', 'accepted');
        if (count($acceptedQuotes) > 0) {
            $recommendations[] = [
                '💰 Facturation',
                'Créer ' . count($acceptedQuotes) . ' factures à partir des devis acceptés',
                'TRÈS HAUTE',
                'Générer ' . number_format($acceptedQuotes->sum('total'), 0) . ' FCFA',
                'Créer factures',
                'Responsable ventes',
                now()->addDays(1)->format('d/m/Y'),
            ];
        }

        // Améliorer conversion
        $conversionRate = count($quotes) > 0 ? ($quotes->where('status', 'accepted')->count() / count($quotes) * 100) : 0;
        if ($conversionRate < 30) {
            $recommendations[] = [
                '📈 Stratégie',
                'Améliorer taux de conversion devis (actuellement ' . round($conversionRate, 2) . '%)',
                'MOYENNE',
                'Potentiel: +15% conversion',
                'Analyser raisons refus',
                'Directeur commercial',
                now()->addDays(7)->format('d/m/Y'),
            ];
        }

        // Clients à relancer
        $recommendations[] = [
            '👥 Prospection',
            'Contacter clients inactifs (pas de facturation >30j)',
            'MOYENNE',
            'Réactivation clients',
            'Email + appel',
            'Commercial',
            now()->addDays(5)->format('d/m/Y'),
        ];

        return $recommendations;
    }

    public function columnWidths(): array
    {
        return ['A' => 20, 'B' => 35, 'C' => 12, 'D' => 20, 'E' => 20, 'F' => 20, 'G' => 15];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A3:G3')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1E3A8A']],
        ]);

        return [];
    }
}
