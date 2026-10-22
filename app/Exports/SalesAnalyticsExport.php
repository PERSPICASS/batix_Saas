<?php

namespace App\Exports;

use App\Exports\Concerns\SanitizesFormulaInjection;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * La page Statistiques (/analytics) en classeur Excel : un onglet par bloc de la page,
 * avec les chiffres que AnalyticsController vient de calculer pour elle. Rien n'est
 * recalculé ici, l'export ne peut donc pas diverger de ce que l'utilisateur voit.
 */
class SalesAnalyticsExport implements WithMultipleSheets
{
    private const PERIODS = [
        'today' => "Aujourd'hui",
        'week' => 'Cette semaine',
        'month' => 'Ce mois',
        'quarter' => 'Ce trimestre',
        'year' => 'Cette année',
    ];

    public function __construct(
        private array $data,
        private Carbon $start,
        private Carbon $end,
        private string $shopName,
    ) {}

    public function sheets(): array
    {
        $currency = $this->data['currencySymbol'];
        $kpis = $this->data['kpis'];
        $comparison = $this->data['comparisonData'];

        return [
            new AnalyticsSheet('Synthèse', ['Indicateur', 'Valeur', 'Période précédente', 'Évolution (%)'], [
                ['Boutique', $this->shopName, '', ''],
                ['Période', (self::PERIODS[$this->data['currentPeriod']] ?? $this->data['currentPeriod'])
                    . ' (du ' . $this->start->format('d/m/Y') . ' au ' . $this->end->format('d/m/Y') . ')', '', ''],
                ['Devise', $currency, '', ''],
                [''],
                ["Chiffre d'affaires", $kpis['revenue']['value'], $kpis['revenue']['previousValue'], $kpis['revenue']['growth']],
                ['Nombre de ventes', $kpis['salesCount']['value'], $kpis['salesCount']['previousValue'], $kpis['salesCount']['growth']],
                ['Panier moyen', $kpis['avgBasket']['value'], $kpis['avgBasket']['previousValue'], $kpis['avgBasket']['growth']],
                ['Marge brute', $kpis['marginRate']['margin'], '', ''],
                ['Taux de marge (%)', $kpis['marginRate']['value'], '', ''],
                ['Nouveaux clients', $kpis['newCustomers']['value'], '', ''],
            ]),

            new AnalyticsSheet('Évolution des ventes', ['Période', "Chiffre d'affaires ({$currency})"], array_map(
                fn ($point) => [$point['label'], $point['value']],
                $this->data['salesChart'],
            )),

            new AnalyticsSheet('Top produits', ['Produit', 'Référence', 'Quantité vendue', "Chiffre d'affaires ({$currency})"], array_map(
                fn ($product) => [$product['name'], $product['sku'], $product['quantity'], $product['revenue']],
                $this->data['topProducts'],
            )),

            new AnalyticsSheet('Catégories', ['Catégorie', "Chiffre d'affaires ({$currency})", 'Part (%)'], array_map(
                fn ($category) => [$category['name'], $category['revenue'], $category['percentage']],
                $this->data['salesByCategory'],
            )),

            new AnalyticsSheet('Top clients', ['Client', 'Téléphone', 'Email', 'Achats', "Total dépensé ({$currency})"], array_map(
                fn ($customer) => [$customer['name'], $customer['phone'], $customer['email'], $customer['salesCount'], $customer['totalSpent']],
                $this->data['topCustomers'],
            )),

            new AnalyticsSheet('Paiements', ['Moyen de paiement', 'Nombre', "Total ({$currency})", 'Part (%)'], array_map(
                fn ($method) => [$method['method'], $method['count'], $method['total'], $method['percentage']],
                $this->data['paymentMethods'],
            )),

            new AnalyticsSheet('Boutiques', ['Boutique', 'Ventes', "Chiffre d'affaires ({$currency})"], array_map(
                fn ($shop) => [$shop['name'], $shop['salesCount'], $shop['revenue']],
                $this->data['shopPerformance'],
            )),

            new AnalyticsSheet('Comparaison', [
                'Période',
                "CA {$comparison['label1']} ({$currency})",
                "CA {$comparison['label2']} ({$currency})",
                "Ventes {$comparison['label1']}",
                "Ventes {$comparison['label2']}",
            ], [
                ...array_map(
                    fn ($row) => [$row['label'], $row['revenue1'], $row['revenue2'], $row['sales1'], $row['sales2']],
                    $comparison['chart'],
                ),
                [''],
                ['Total', $comparison['totals']['revenue']['v1'], $comparison['totals']['revenue']['v2'],
                    $comparison['totals']['sales']['v1'], $comparison['totals']['sales']['v2']],
                ['Évolution (%)', $comparison['totals']['revenue']['growth'], '', $comparison['totals']['sales']['growth'], ''],
            ]),
        ];
    }
}

class AnalyticsSheet implements FromArray, WithHeadings, WithTitle, ShouldAutoSize, WithStyles, WithCustomValueBinder
{
    // Noms de produits et de clients saisis par la boutique : voir le trait.
    use SanitizesFormulaInjection;

    public function __construct(
        private string $title,
        private array $headings,
        private array $rows,
    ) {}

    public function title(): string
    {
        return $this->title;
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function styles(Worksheet $sheet): array
    {
        return [1 => ['font' => ['bold' => true]]];
    }
}
