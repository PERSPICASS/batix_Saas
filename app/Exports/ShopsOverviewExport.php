<?php

namespace App\Exports;

use App\Exports\Concerns\SanitizesFormulaInjection;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * « Mes boutiques » en Excel : les chiffres de l'écran, ligne pour ligne, avec en plus la
 * période précédente et l'évolution, que l'écran ne montre qu'en flèche.
 *
 * Les montants restent des nombres (pas de texte formaté) pour que le fichier se recalcule
 * et se trie ; la devise a sa propre colonne, puisque des boutiques de pays différents ne
 * s'additionnent pas.
 */
class ShopsOverviewExport implements FromArray, ShouldAutoSize, WithStyles, WithTitle, WithCustomValueBinder, WithStrictNullComparison
{
    use SanitizesFormulaInjection;

    /** Ligne des en-têtes ; au-dessus, le titre et la période. */
    private const HEADING_ROW = 3;

    /** Les chiffres comparés à la période précédente. */
    private const COMPARED = [
        'revenue' => 'CA',
        'count' => 'Ventes',
        'average_basket' => 'Panier moyen',
        'gross_margin' => 'Marge brute',
    ];

    /** Les chiffres sans comparaison. */
    private const SINGLE = [
        'expenses' => 'Dépenses',
        'receivables' => 'Créances (à ce jour)',
        'stock_value' => 'Valeur du stock (à ce jour)',
        'low_stock' => 'Alertes stock (à ce jour)',
    ];

    private int $totalRows = 0;

    public function __construct(private Collection $rows, private Collection $totals, private array $period) {}

    public function title(): string
    {
        return 'Mes boutiques';
    }

    public function array(): array
    {
        $date = fn (string $iso) => Carbon::parse($iso)->format('d/m/Y');

        $headings = ['Boutique', 'Devise'];
        foreach (self::COMPARED as $label) {
            array_push($headings, $label, "{$label} (période précédente)", "{$label} : évolution");
        }
        foreach (self::SINGLE as $label) {
            $headings[] = $label;
        }

        $lines = [
            ["Mes boutiques — du {$date($this->period['start'])} au {$date($this->period['end'])}, comparé au {$date($this->period['previous_start'])} – {$date($this->period['previous_end'])}"],
            // Une cellule vide, pas un tableau vide : une ligne sans cellule est sautée, ce qui
            // décalait les en-têtes d'une ligne et les formats de colonnes avec.
            [''],
            $headings,
        ];

        foreach ($this->rows as $row) {
            $lines[] = $this->line($row['name'] . ($row['is_active'] ? '' : ' (inactive)'), $row['currency'], $row['figures'], $row['previous']);
        }

        foreach ($this->totals as $total) {
            $lines[] = $this->line("Total {$total['currency']}", $total['currency'], $total['figures'], $total['previous']);
            $this->totalRows++;
        }

        return $lines;
    }

    private function line(string $name, string $currency, array $figures, array $previous): array
    {
        $line = [$name, $currency];

        foreach (array_keys(self::COMPARED) as $key) {
            $now = (float) ($figures[$key] ?? 0);
            $before = (float) ($previous[$key] ?? 0);
            // Une fraction, que la colonne affiche en pourcentage ; vide sans base de comparaison.
            array_push($line, $now, $before, $before != 0.0 ? round(($now - $before) / abs($before), 4) : null);
        }

        foreach (array_keys(self::SINGLE) as $key) {
            $line[] = (float) ($figures[$key] ?? 0);
        }

        return $line;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = self::HEADING_ROW + $this->rows->count() + $this->totalRows;
        $lastColumn = $sheet->getHighestColumn();

        // Montants au format milliers ; colonnes d'évolution en pourcentage ; compteurs entiers.
        $column = 3;
        foreach (array_keys(self::COMPARED) as $key) {
            $format = $key === 'count' ? NumberFormat::FORMAT_NUMBER : '#,##0';
            foreach ([$column, $column + 1] as $index) {
                $sheet->getStyle($this->cell($index, self::HEADING_ROW + 1) . ':' . $this->cell($index, $lastRow))->getNumberFormat()->setFormatCode($format);
            }
            $sheet->getStyle($this->cell($column + 2, self::HEADING_ROW + 1) . ':' . $this->cell($column + 2, $lastRow))->getNumberFormat()->setFormatCode('+0.0%;-0.0%;0.0%');
            $column += 3;
        }
        foreach (array_keys(self::SINGLE) as $key) {
            $sheet->getStyle($this->cell($column, self::HEADING_ROW + 1) . ':' . $this->cell($column, $lastRow))->getNumberFormat()
                ->setFormatCode($key === 'low_stock' ? NumberFormat::FORMAT_NUMBER : '#,##0');
            $column++;
        }

        $styles = [
            1 => ['font' => ['bold' => true, 'size' => 13]],
            self::HEADING_ROW => ['font' => ['bold' => true]],
        ];
        for ($row = $lastRow - $this->totalRows + 1; $row <= $lastRow; $row++) {
            $styles["A{$row}:{$lastColumn}{$row}"] = ['font' => ['bold' => true]];
        }

        return $styles;
    }

    private function cell(int $column, int $row): string
    {
        return \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($column) . $row;
    }
}
