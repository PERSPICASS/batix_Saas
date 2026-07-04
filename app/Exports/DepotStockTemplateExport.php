<?php

namespace App\Exports;

use App\Exports\Concerns\SanitizesFormulaInjection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DepotStockTemplateExport implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithColumnWidths, WithTitle, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    public function title(): string
    {
        return 'Import Stock Dépôt';
    }

    public function headings(): array
    {
        return [
            'sku',
            'code_barres',
            'nom',
            'quantite',
            'stock_minimum',
            'prix_achat',
        ];
    }

    public function array(): array
    {
        return [
            ['SKU-001',          '',              'Ciment Portland 50kg',   100, 10, 12500],
            ['',    '1234567890123',              'Barre de fer 12mm',       50,  5,  8500],
            ['SKU-003',          '',              'Sable fin (sac 25kg)',   200, 20,  3000],
            ['',                 '',              'Parpaing standard',      500, 50,   450],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 16, // sku
            'B' => 18, // code_barres
            'C' => 32, // nom
            'D' => 12, // quantite
            'E' => 16, // stock_minimum
            'F' => 16, // prix_achat
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = count($this->array()) + 1;

        // En-tête jaune/dorée — couleur cohérente avec l'UI
        $sheet->getStyle('A1:F1')->applyFromArray([
            'font' => [
                'bold'  => true,
                'size'  => 11,
                'color' => ['rgb' => '1E293B'],
            ],
            'fill' => [
                'fillType'   => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'FCD34D'],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Bordures sur toute la plage de données
        $sheet->getStyle("A1:F{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color'       => ['rgb' => 'CBD5E1'],
                ],
            ],
        ]);

        // Lignes de données en alternance
        for ($i = 2; $i <= $lastRow; $i++) {
            $color = ($i % 2 === 0) ? 'F8FAFC' : 'FFFFFF';
            $sheet->getStyle("A{$i}:F{$i}")->applyFromArray([
                'fill' => [
                    'fillType'   => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $color],
                ],
            ]);
        }

        // Format numérique pour les colonnes quantité, stock_min, prix_achat
        $sheet->getStyle("D2:D{$lastRow}")->getNumberFormat()->setFormatCode('0');
        $sheet->getStyle("E2:E{$lastRow}")->getNumberFormat()->setFormatCode('0');
        $sheet->getStyle("F2:F{$lastRow}")->getNumberFormat()->setFormatCode('#,##0');

        // Commentaires d'aide sur les en-têtes
        $sheet->getComment('A1')->getText()->createTextRun('SKU / Référence du produit (optionnel si code-barres ou nom fourni)');
        $sheet->getComment('B1')->getText()->createTextRun('Code-barres EAN (optionnel si SKU ou nom fourni)');
        $sheet->getComment('C1')->getText()->createTextRun('Obligatoire si ni SKU ni code-barres fourni. Doit correspondre exactement au nom du produit dans la boutique.');
        $sheet->getComment('D1')->getText()->createTextRun('Quantité à ajouter au stock existant (nombre entier ≥ 1)');
        $sheet->getComment('E1')->getText()->createTextRun('Seuil d\'alerte stock faible (optionnel, 0 par défaut)');
        $sheet->getComment('F1')->getText()->createTextRun('Prix d\'achat unitaire en FCFA (optionnel)');

        // Figer la ligne d'en-tête
        $sheet->freezePane('A2');

        return [];
    }
}
