<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    protected $fillable = [
        'shop_id',
        'supplier_id',
        'user_id',
        'reference',
        'status',
        'order_date',
        'expected_date',
        'received_date',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_cost',
        'total',
        'currency',
        'notes',
        'internal_notes',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_date' => 'date',
        'received_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Boot method to generate reference automatically
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($purchase) {
            if (!$purchase->reference) {
                $year = date('Y');
                $lastPurchase = static::where('shop_id', $purchase->shop_id)
                    ->whereYear('created_at', $year)
                    ->orderBy('id', 'desc')
                    ->first();
                
                $number = $lastPurchase ? intval(substr($lastPurchase->reference, -4)) + 1 : 1;
                $purchase->reference = 'PO-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * Get the shop that owns the purchase.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get the supplier for this purchase.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the user who created this purchase.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the items for this purchase.
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * Calculate totals
     */
    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum('subtotal');
        $this->tax_amount = $this->items->sum('tax_amount');
        $this->discount_amount = $this->items->sum('discount_amount');
        $this->total = $this->subtotal + $this->tax_amount - $this->discount_amount + $this->shipping_cost;
        $this->save();
    }

    /**
     * Check if purchase is fully received
     */
    public function isFullyReceived(): bool
    {
        return $this->items->every(function ($item) {
            return $item->quantity_received >= $item->quantity_ordered;
        });
    }

    /**
     * Check if purchase is partially received
     */
    public function isPartiallyReceived(): bool
    {
        $hasReceived = $this->items->some(function ($item) {
            return $item->quantity_received > 0;
        });
        
        return $hasReceived && !$this->isFullyReceived();
    }
}
