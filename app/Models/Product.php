<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        'shop_id',
        'category_id',
        'subcategory_id',
        'name',
        'slug',
        'sku',
        'barcode',
        'description',
        'purchase_price',
        'selling_price',
        'tax_rate',
        'stock_quantity',
        'min_stock_alert',
        'unit',
        'image',
        'is_active',
        'track_stock',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'stock_quantity' => 'integer',
        'min_stock_alert' => 'integer',
        'is_active' => 'boolean',
        'track_stock' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty('name') && empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function isLowStock(): bool
    {
        if (!$this->track_stock || $this->min_stock_alert === null) {
            return false;
        }

        return $this->stock_quantity <= $this->min_stock_alert;
    }

    public function getPriceWithTaxAttribute(): float
    {
        return $this->selling_price * (1 + $this->tax_rate / 100);
    }

    public function getMarginAttribute(): float
    {
        return $this->selling_price - $this->purchase_price;
    }

    public function getMarginPercentageAttribute(): float
    {
        if ($this->purchase_price == 0) {
            return 0;
        }
        
        return (($this->selling_price - $this->purchase_price) / $this->purchase_price) * 100;
    }
}
