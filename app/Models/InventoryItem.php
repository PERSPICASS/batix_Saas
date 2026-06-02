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
        'counted_quantity',
        'defective_quantity',
        'difference',
        'unit_cost',
        'notes',
    ];

    protected $casts = [
        'expected_quantity' => 'integer',
        'counted_quantity' => 'integer',
        'defective_quantity' => 'integer',
        'difference' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $totalCounted = ($item->counted_quantity ?? 0) + ($item->defective_quantity ?? 0);
            $item->difference = $totalCounted - $item->expected_quantity;
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
