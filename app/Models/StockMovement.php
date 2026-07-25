<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    protected $fillable = [
        'shop_id',
        'product_id',
        'depot_id',
        'user_id',
        'type',
        'quantity',
        'unit_cost',
        'reference_id',
        'reference_type',
        'notes',
        'movement_date',
    ];

    protected $casts = [
        'movement_date' => 'date',
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Le dépôt concerné, ou null pour le stock du comptoir.
     */
    public function depot(): BelongsTo
    {
        return $this->belongsTo(Depot::class);
    }

    /** Mouvements du comptoir, ceux que reflète products.stock_quantity. */
    public function scopeAtCounter($query)
    {
        return $query->whereNull('depot_id');
    }

    public function scopeInDepot($query, int $depotId)
    {
        return $query->where('depot_id', $depotId);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
