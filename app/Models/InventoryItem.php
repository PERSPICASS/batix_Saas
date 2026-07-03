<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryItem extends Model
{
    protected $fillable = [
        'inventory_id',
        'product_id',
        'expected_quantity',
        'expected_defective_quantity',
        'counted_quantity',
        'defective_quantity',
        'difference',
        'defective_difference',
        'unit_cost',
        'notes',
    ];

    protected $casts = [
        'expected_quantity' => 'integer',
        'expected_defective_quantity' => 'integer',
        'counted_quantity' => 'integer',
        'defective_quantity' => 'integer',
        'difference' => 'integer',
        'defective_difference' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        // Kept as two independent deltas (not blended) because the actual stock
        // adjustment on completion (StockMovementService::recordInventoryAdjustmentWithDefective)
        // moves stock_quantity and defective_stock_quantity separately.
        static::saving(function ($item) {
            $item->difference = ($item->counted_quantity ?? 0) - $item->expected_quantity;
            $item->defective_difference = ($item->defective_quantity ?? 0) - $item->expected_defective_quantity;
        });
    }

    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
