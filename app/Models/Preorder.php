<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Preorder extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'product_id',
        'shop_id',
        'user_id',
        'quantity_ordered',
        'unit_price',
        'expected_delivery_date',
        'deposit_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'quantity_ordered' => 'integer',
        'unit_price' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'expected_delivery_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getTotalPriceAttribute(): float
    {
        return $this->quantity_ordered * $this->unit_price;
    }

    public function getRemainingBalanceAttribute(): float
    {
        return max(0, $this->total_price - ($this->deposit_amount ?? 0));
    }

    public function isOverdue(): bool
    {
        return $this->status !== 'completed' && $this->status !== 'cancelled' && now()->isAfter($this->expected_delivery_date);
    }
}
