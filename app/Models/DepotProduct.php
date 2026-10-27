<?php

namespace App\Models;

use App\Casts\Quantity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepotProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'depot_id',
        'product_id',
        'quantity',
        'min_stock_alert',
        'purchase_price',
    ];

    protected $casts = [
        'quantity'       => Quantity::class,
        'min_stock_alert' => Quantity::class,
        'purchase_price' => 'decimal:2',
    ];

    public function depot(): BelongsTo
    {
        return $this->belongsTo(Depot::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->min_stock_alert;
    }
}
