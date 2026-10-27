<?php

namespace App\Http\Requests\Api\V1;

use App\Rules\QuantityForProduct;
use App\Rules\AccessibleCategory;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Mêmes règles que ProductController::update() (formulaire web).
 */
class UpdateProductApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', AccessibleCategory::visible($this->user())],
            'subcategory_id' => ['nullable', AccessibleCategory::subcategory($this->user())],
            'name' => 'sometimes|required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'purchase_price' => 'sometimes|required|numeric|min:0',
            'selling_price' => 'sometimes|required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'stock_quantity' => ['nullable', 'numeric', 'min:0', QuantityForProduct::forUnit($this->input('unit', $this->route('product')?->unit))],
            'min_stock_alert' => ['nullable', 'numeric', 'min:0', QuantityForProduct::forUnit($this->input('unit', $this->route('product')?->unit))],
            'unit' => 'nullable|string|max:50',
            'track_stock' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
