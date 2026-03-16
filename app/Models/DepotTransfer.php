<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepotTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'depot_id',
        'shop_id',
        'user_id',
        'product_id',
        'quantity',
        'notes',
        'status',
        'transferred_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'transferred_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (empty($transfer->reference)) {
                $transfer->reference = self::generateReference();
            }
        });
    }

    public static function generateReference(): string
    {
        $year = date('Y');
        $lastTransfer = self::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        $number = $lastTransfer ? (int) substr($lastTransfer->reference, -4) + 1 : 1;
        return 'TRF-' . $year . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }

    public function depot(): BelongsTo
    {
        return $this->belongsTo(Depot::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
