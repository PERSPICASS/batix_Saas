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
            
            // Remettre le stock si le produit existe et que le suivi de stock est activé
            if ($saleItem->product && $saleItem->product->track_stock) {
                $saleItem->product->increment('stock_quantity', $return->quantity_returned);
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
