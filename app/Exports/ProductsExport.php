<?php

namespace App\Exports;

use App\Exports\Concerns\SanitizesFormulaInjection;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithCustomValueBinder
{
    use SanitizesFormulaInjection;

    protected ?int $shopId;

    public function __construct(?int $shopId = null)
    {
        $this->shopId = $shopId;
    }

    public function collection()
    {
        $query = Product::with(['category', 'subcategory', 'shop']);

        if ($this->shopId) {
            $query->where('shop_id', $this->shopId);
        } else {
            // Filtrer par boutiques accessibles
            $query->whereIn('shop_id', Auth::user()->accessibleShopsQuery()->pluck('id'));
        }

        return $query->orderBy('name')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nom',
            'SKU',
            'Code-barres',
            'Marque',
            'Categorie',
            'Sous-categorie',
            'Description',
            'Unite',
            'Prix achat',
            'Prix vente',
            'Stock',
            'Stock minimum',
            'Suivi stock',
            'Actif',
            'Boutique',
        ];
    }

    public function map($product): array
    {
        return [
            $product->id,
            $product->name,
            $product->sku,
            $product->barcode,
            $product->brand,
            $product->category?->name,
            $product->subcategory?->name,
            $product->description,
            $product->unit,
            $product->purchase_price,
            $product->selling_price,
            $product->stock_quantity,
            $product->min_stock_alert,
            $product->track_stock ? 'Oui' : 'Non',
            $product->is_active ? 'Oui' : 'Non',
            $product->shop?->name,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FCD34D'], // amber-300
                ],
            ],
        ];
    }
}
