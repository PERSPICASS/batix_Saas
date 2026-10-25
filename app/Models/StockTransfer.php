<?php

namespace App\Models;

use App\Support\DocumentNumber;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Du stock qui part d'une boutique du compte vers une autre (StockTransferService).
 */
class StockTransfer extends Model
{
    protected $fillable = [
        'reference',
        'from_shop_id',
        'to_shop_id',
        'user_id',
        'received_by',
        'status',
        'notes',
        'sent_at',
        'received_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (empty($transfer->reference)) {
                $transfer->reference = DocumentNumber::next(
                    static::where('from_shop_id', $transfer->from_shop_id),
                    'reference',
                    'TRS-' . date('Ym'),
                );
            }
        });
    }

    public function fromShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'from_shop_id');
    }

    public function toShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'to_shop_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }
}
