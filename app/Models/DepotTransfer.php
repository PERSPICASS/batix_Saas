<?php

namespace App\Models;

use App\Support\DocumentNumber;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToShop;

class DepotTransfer extends Model
{
    use BelongsToShop, HasFactory;

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
                $transfer->reference = self::generateReference($transfer->shop_id);
            }
        });
    }

    /** Per shop, like the (shop_id, reference) unique constraint. */
    public static function generateReference($shopId): string
    {
        return DocumentNumber::next(self::where('shop_id', $shopId), 'reference', 'TRF-' . date('Y') . '-');
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
