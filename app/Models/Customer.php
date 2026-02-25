<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'name',
        'email',
        'phone',
        'address',
        'notes',
        'is_active',
        'total_purchases',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'total_purchases' => 'decimal:2',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function updateTotalPurchases(): void
    {
        $this->total_purchases = $this->invoices()
            ->where('status', 'paid')
            ->sum('total');
        $this->save();
    }
}
