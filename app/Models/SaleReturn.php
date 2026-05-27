<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturn extends Model
{
    use HasFactory;

    protected $table = 'returns';

    protected $fillable = [
        'sale_id',
        'sale_item_id',
        'user_id',
        'quantity_returned',
        'refund_amount',
        'refund_method',
        'reason',
        'notes',
        'return_date',
    ];

    protected $casts = [
        'quantity_returned' => 'integer',
        'refund_amount' => 'decimal:2',
        'return_date' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($return) {
            if (!$return->return_date) {
                $return->return_date = now();
            }
        });
        
        static::created(function ($return) {
            // Marquer l'article comme retourné si toute la quantité est retournée
            $saleItem = $return->saleItem;
            $totalReturned = $saleItem->returns->sum('quantity_returned');

            if ($totalReturned >= $saleItem->quantity) {
                $saleItem->update(['is_returned' => true]);
            }

            // Créer une entrée dans returned_inventories au lieu de modifier le stock immédiatement
            if ($saleItem->product) {
                \App\Models\ReturnedInventory::create([
                    'sale_return_id' => $return->id,
                    'product_id' => $saleItem->product_id,
                    'shop_id' => $return->sale->shop_id,
                    'quantity' => $return->quantity_returned,
                    'reason' => $return->reason,
                    'condition' => $return->reason === 'defective' ? 'defective' : 'good',
                    'status' => 'pending',
                    'notes' => $return->notes,
                ]);
            }

            // Vérifier si toute la vente est retournée
            $sale = $return->sale;
            $allItemsReturned = $sale->items->every(function ($item) {
                return $item->is_returned;
            });

            if ($allItemsReturned) {
                $sale->update(['status' => 'returned']);
            }
        });
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
