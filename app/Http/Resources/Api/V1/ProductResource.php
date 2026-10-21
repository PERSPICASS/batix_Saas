<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'name' => $this->name,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'description' => $this->description,
            'brand' => $this->brand,
            'purchase_price' => (float) $this->purchase_price,
            'selling_price' => (float) $this->selling_price,
            'tax_rate' => (float) $this->tax_rate,
            'stock_quantity' => $this->stock_quantity,
            'min_stock_alert' => $this->min_stock_alert,
            'unit' => $this->unit,
            'is_active' => $this->is_active,
            'track_stock' => $this->track_stock,
            'has_variations' => $this->has_variations,
            'category' => $this->whenLoaded('category', fn () => $this->category?->name),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
