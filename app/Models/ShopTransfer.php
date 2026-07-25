<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * La copie de produits d'une boutique vers une autre.
 *
 * Un compte saisit son catalogue une fois ; ouvrir une succursale ne doit pas obliger à
 * tout ressaisir. C'est une copie, pas un mouvement de marchandise : la boutique d'origine
 * n'est pas touchée, et rien n'entre au registre des stocks.
 */
class ShopTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'from_shop_id',
        'to_shop_id',
        'user_id',
        'notes',
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
}
