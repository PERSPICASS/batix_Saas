<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseItem extends Model
{
    protected $fillable = [
        'purchase_id',
        'product_id',
        'product_name',
        'product_sku',
        'quantity_ordered',
        'quantity_received',
        'unit_price',
        'tax_rate',
        'tax_amount',
        'discount_rate',
        'discount_amount',
        'subtotal',
        'total',
        'notes',
    ];

    protected $casts = [
        'quantity_ordered' => 'integer',
        'quantity_received' => 'integer',
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Boot method to calculate amounts automatically
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            // Calculer le sous-total
            $item->subtotal = $item->quantity_ordered * $item->unit_price;
            
            // Calculer la remise
            if ($item->discount_rate > 0) {
                $item->discount_amount = $item->subtotal * ($item->discount_rate / 100);
            }
            
            // Sous-total après remise
            $subtotalAfterDiscount = $item->subtotal - $item->discount_amount;
            
            // Calculer la taxe
            if ($item->tax_rate > 0) {
                $item->tax_amount = $subtotalAfterDiscount * ($item->tax_rate / 100);
            }
            
            // Total final
            $item->total = $subtotalAfterDiscount + $item->tax_amount;
        });

        static::saved(function ($item) {
            // Recalculer les totaux du bon de commande
            $item->purchase->calculateTotals();
        });

        static::deleted(function ($item) {
            // Recalculer les totaux du bon de commande
            $item->purchase->calculateTotals();
        });
    }

    /**
     * Get the purchase that owns this item.
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Get the product for this item.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get remaining quantity to receive
     */
    public function getRemainingQuantityAttribute(): int
    {
        return $this->quantity_ordered - $this->quantity_received;
    }
}
