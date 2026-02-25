<?php

namespace App\Exports;

use App\Models\Category;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsTemplateExport implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithColumnWidths
{
    public function array(): array
    {
        // Exemples de données pour guider l'utilisateur
        return [
            [
                'Perceuse sans fil 18V',
                'PERC-18V-001',
                '6901234567890',
                'Bosch',
                'Outillage électrique',
                'Perceuses',
                'Perceuse professionnelle avec batterie lithium',
                'Pièce',
                45000,
                75000,
                25,
                5,
                'Oui',
                'Oui',
            ],
            [
                'Vis à bois 4x40mm (boîte 200)',
                'VIS-BOIS-4X40',
                '6901234567891',
                'Stanley',
                'Visserie et fixation',
                'Vis',
                'Vis à bois tête fraisée',
                'Boîte',
                1500,
                2500,
                150,
                20,
                'Oui',
                'Oui',
            ],
            [
                'Peinture acrylique blanc 10L',
                'PEINT-ACR-BL-10',
                '',
                'Seigneurie',
                'Peinture et finition',
                'Peintures',
                'Peinture intérieure mate',
                'Litre',
                8000,
                12500,
                30,
                5,
                'Oui',
                'Oui',
            ],
        ];
    }

    public function headings(): array
    {
        return [
            'nom',
            'sku',
            'code_barres',
            'marque',
            'categorie',
            'sous_categorie',
            'description',
            'unite',
            'prix_achat',
            'prix_vente',
            'stock',
            'stock_minimum',
            'suivi_stock',
            'actif',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 30,
            'B' => 18,
            'C' => 18,
            'D' => 18,
            'E' => 22,
            'F' => 18,
            'G' => 40,
            'H' => 12,
            'I' => 15,
            'J' => 15,
            'K' => 10,
            'L' => 15,
            'M' => 12,
            'N' => 10,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Style pour l'en-tête
        $sheet->getStyle('A1:N1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1E293B']],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'FCD34D'],
            ],
        ]);

        // Bordures pour toutes les cellules avec données
        $sheet->getStyle('A1:N4')->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => 'CBD5E1'],
                ],
            ],
        ]);

        // Commentaires d'aide
        $sheet->getComment('A1')->getText()->createTextRun('Obligatoire : Le nom du produit');
        $sheet->getComment('J1')->getText()->createTextRun('Obligatoire : Le prix de vente');
        $sheet->getComment('D1')->getText()->createTextRun('Marque du produit (optionnel)');
        $sheet->getComment('E1')->getText()->createTextRun('Doit correspondre à une catégorie existante dans votre boutique');
        $sheet->getComment('H1')->getText()->createTextRun('Ex: Pièce, Kg, Litre, Boîte, Sac, Mètre');
        $sheet->getComment('I1')->getText()->createTextRun('Prix d\'achat HT');
        $sheet->getComment('M1')->getText()->createTextRun('Oui ou Non');
        $sheet->getComment('N1')->getText()->createTextRun('Oui ou Non');

        return [];
    }
}
