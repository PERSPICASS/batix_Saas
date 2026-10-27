<?php

namespace App\Exports;

use App\Exports\Concerns\SanitizesFormulaInjection;
use App\Models\Inventory;
use App\Models\InventoryItem;
use App\Support\Unit;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Le résultat d'un inventaire : attendu, compté, écart et sa valeur, produit par produit.
 *
 * Une ligne non comptée garde ses cellules « compté », « écart » et « valeur » vides, pas à
 * 0 : 0 voudrait dire « compté, aucun trouvé », ce qui est l'inverse (voir InventoryController).
 * Les quantités restent des nombres, l'unité a sa colonne, pour que le fichier se trie et
 * se recalcule.
 */
class InventoryExport implements FromArray, ShouldAutoSize, WithStyles, WithTitle, WithCustomValueBinder, WithStrictNullComparison
{
    use SanitizesFormulaInjection;

    /** Ligne des en-têtes ; au-dessus, le titre et l'en-tête de l'inventaire. */
    private const HEADING_ROW = 4;

    private const STATUSES = [
        'draft' => 'Brouillon',
        'in_progress' => 'En cours',
        'completed' => 'Terminé',
        'cancelled' => 'Annulé',
    ];

    public function __construct(private Inventory $inventory) {}

    public function title(): string
    {
        return 'Inventaire';
    }

    public function array(): array
    {
        $inventory = $this->inventory;
        $status = self::STATUSES[$inventory->status] ?? $inventory->status;

        $lines = [
            ["Inventaire {$inventory->inventory_number} — {$inventory->shop?->name}"],
            ["Date : {$inventory->inventory_date?->format('d/m/Y')} · Statut : {$status} · Effectué par : " . ($inventory->user?->name ?? '—') . ' · Devise : ' . $inventory->shop?->currency],
            [''],
            [
                'Produit', 'SKU', 'Unité', 'Attendu', 'Compté', 'Écart',
                'Défectueux attendu', 'Défectueux compté', 'Écart défectueux',
                'Coût unitaire', "Valeur de l'écart",
            ],
        ];

        foreach ($this->items() as $item) {
            $counted = $item->counted_quantity !== null;
            $defectiveCounted = $item->defective_quantity !== null;

            $lines[] = [
                $item->product?->name,
                $item->product?->sku,
                Unit::label($item->product?->unit),
                $item->expected_quantity,
                $item->counted_quantity,
                $counted ? $item->difference : null,
                $item->expected_defective_quantity,
                $item->defective_quantity,
                $defectiveCounted ? $item->defective_difference : null,
                (float) $item->unit_cost,
                $counted ? $item->discrepancyValue() : null,
            ];
        }

        $lines[] = [
            'Total', null, null, null, null, null, null, null, null, null,
            round($this->items()->sum(fn (InventoryItem $item) => $item->discrepancyValue()), 2),
        ];

        return $lines;
    }

    /** Par nom de produit : c'est ainsi qu'on relit un inventaire, rayon par rayon. */
    private function items()
    {
        return $this->inventory->items->sortBy(fn (InventoryItem $item) => mb_strtolower($item->product?->name ?? ''))->values();
    }

    public function styles(Worksheet $sheet): array
    {
        $first = self::HEADING_ROW + 1;
        $last = self::HEADING_ROW + $this->inventory->items->count() + 1;

        // Quantités en « Standard » : 2,5 et 12 s'affichent tels quels, alors qu'un format
        // « 0.### » laisse une virgule orpheline derrière chaque nombre entier (« 12, »).
        // Les écarts portent leur signe, les montants le format milliers.
        $sheet->getStyle("F{$first}:F{$last}")->getNumberFormat()->setFormatCode('+General;-General;0');
        $sheet->getStyle("I{$first}:I{$last}")->getNumberFormat()->setFormatCode('+General;-General;0');
        $sheet->getStyle("J{$first}:J{$last}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->getStyle("K{$first}:K{$last}")->getNumberFormat()->setFormatCode('+#,##0.00;-#,##0.00;0.00');

        return [
            1 => ['font' => ['bold' => true, 'size' => 13]],
            self::HEADING_ROW => ['font' => ['bold' => true]],
            $last => ['font' => ['bold' => true]],
        ];
    }
}
