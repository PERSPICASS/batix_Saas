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
    ];

    protected $casts = [
        'inventory_date' => 'date',
        'total_items' => 'integer',
        'total_discrepancies' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($inventory) {
            if (empty($inventory->inventory_number)) {
                $inventory->inventory_number = self::generateInventoryNumber();
            }
        });
    }

    public static function generateInventoryNumber(): string
    {
        $date = now()->format('Ym');
        $lastInventory = self::where('inventory_number', 'like', "INV-{$date}%")
            ->orderBy('inventory_number', 'desc')
            ->first();

        if ($lastInventory) {
            $lastNumber = (int) substr($lastInventory->inventory_number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return "INV-{$date}{$newNumber}";
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
