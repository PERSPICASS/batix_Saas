<?php

namespace App\Models;

use App\Services\StockMovementService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name',
        'sku',
        'quantity',
        'unit_price',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'total',
        'is_returned',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'is_returned' => 'boolean',
    ];

    public int $originalQuantityBeforeSave = 0;

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            // Calculer le montant de la taxe
            $subtotal = ($item->unit_price * $item->quantity) - $item->discount_amount;
            $item->tax_amount = $subtotal * ($item->tax_rate / 100);
            $item->total = $subtotal + $item->tax_amount;

            // Capture original quantity before save (for delta calculation on updates)
            if ($item->exists) {
                $item->originalQuantityBeforeSave = (int) $item->getOriginal('quantity');
            }
        });

        static::saved(function ($item) {
            $item->sale->calculateTotals();

            if (!$item->product || !$item->product->track_stock || $item->is_returned) {
                return;
            }

            if ($item->wasRecentlyCreated) {
                StockMovementService::recordSale(
                    $item->product,
                    $item->quantity,
                    $item->sale->shop_id,
                    $item->sale,
                    "Vente article: {$item->product_name}"
                );
            } else {
                StockMovementService::recordSaleItemEdit(
                    $item->product,
                    $item->originalQuantityBeforeSave,
                    $item->quantity,
                    $item->sale->shop_id,
                    $item->sale
                );
            }
        });

        static::deleted(function ($item) {
            $item->sale->calculateTotals();
        });
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function getRemainingQuantityAttribute(): int
    {
        $returnedQty = $this->returns->sum('quantity_returned');
        return $this->quantity - $returnedQty;
    }
}
