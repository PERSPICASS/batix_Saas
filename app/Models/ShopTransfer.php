<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Un transfert de marchandise d'une boutique vers une autre.
 *
 * Le document manquait : un transfert ne laissait que ses mouvements de stock, donc aucune
 * trace consultable de qui avait envoyé quoi, ni de quoi annuler.
 */
class ShopTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'from_shop_id',
        'to_shop_id',
        'user_id',
        'status',
        'notes',
        'cancelled_at',
    ];

    protected $casts = [
        'cancelled_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (!$transfer->reference) {
                $transfer->reference = static::generateReference($transfer->from_shop_id);
            }
        });
    }

    /**
     * Numéroté par boutique d'origine et par mois, comme les factures.
     *
     * Le numéro se déduit du plus élevé déjà émis. Rien n'est jamais supprimé — une
     * annulation change le statut — donc aucun numéro ne revient en circulation.
     */
    public static function generateReference($fromShopId): string
    {
        $prefix = 'TRF-' . date('Ym');

        $last = static::where('from_shop_id', $fromShopId)
            ->where('reference', 'like', "{$prefix}%")
            ->orderBy('reference', 'desc')
            ->first();

        $next = $last ? ((int) substr($last->reference, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
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

    public function items(): HasMany
    {
        return $this->hasMany(ShopTransferItem::class);
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }
}
