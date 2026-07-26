<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inventory extends Model
{
    protected $fillable = [
        'shop_id',
        'user_id',
        'inventory_number',
        'inventory_date',
        'status',
        'notes',
        'total_items',
        'total_discrepancies',
        'completed_at',
    ];

    protected $casts = [
        'inventory_date' => 'date',
        'completed_at' => 'datetime',
        'total_items' => 'integer',
        'total_discrepancies' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($inventory) {
            if (empty($inventory->inventory_number)) {
                $inventory->inventory_number = self::generateInventoryNumber($inventory->shop_id);
            }
        });
    }

    /**
     * Le numéro se déduit du plus élevé déjà émis dans LA BOUTIQUE pour le mois courant.
     *
     * Le filtre par boutique n'est pas cosmétique : sans lui, une boutique héritait des
     * numéros consommés par les autres comptes — donc une numérotation à trous, qui laisse
     * deviner l'activité de la plateforme. Même schéma que CreditNote et Invoice.
     */
    public static function generateInventoryNumber($shopId): string
    {
        $prefix = 'INV-' . now()->format('Ym');

        $last = self::where('shop_id', $shopId)
            ->where('inventory_number', 'like', "{$prefix}%")
            ->orderBy('inventory_number', 'desc')
            ->first();

        $next = $last ? ((int) substr($last->inventory_number, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }
}
