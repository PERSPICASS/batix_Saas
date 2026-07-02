<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Mêmes règles que ProductController::store() (formulaire web) — gardées en phase
 * pour que l'API et l'interface acceptent/rejettent exactement les mêmes données.
 */
class StoreProductApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // le scope de boutique est vérifié dans le contrôleur
    }

    public function rules(): array
    {
        return [
            'shop_id' => 'required|exists:shops,id',
            'category_id' => 'nullable|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'stock_quantity' => 'nullable|integer|min:0',
            'min_stock_alert' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'track_stock' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
