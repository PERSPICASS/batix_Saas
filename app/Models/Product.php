<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;
    protected $fillable = [
        'shop_id',
        'category_id',
        'subcategory_id',
        'name',
        'slug',
        'sku',
        'barcode',
        'description',
        'brand',
        'purchase_price',
        'selling_price',
        'tax_rate',
        'stock_quantity',
        'defective_stock_quantity',
        'min_stock_alert',
        'unit',
        'image',
        'is_active',
        'track_stock',
        'has_variations',
        'parent_id',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'stock_quantity' => 'integer',
        'defective_stock_quantity' => 'integer',
        'min_stock_alert' => 'integer',
        'is_active' => 'boolean',
        'track_stock' => 'boolean',
        'has_variations' => 'boolean',
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

    /**
     * Le produit parent (si c'est une variation).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'parent_id');
    }

    /**
     * Les variations de ce produit.
     */
    public function variations(): HasMany
    {
        return $this->hasMany(Product::class, 'parent_id');
    }

    /**
     * Les valeurs d'attributs de cette variation.
     */
    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(ProductAttributeValue::class, 'product_variation_attributes', 'product_id', 'attribute_value_id');
    }

    /**
     * Vérifie si ce produit est une variation.
     */
    public function isVariation(): bool
    {
        return $this->parent_id !== null;
    }

    /**
     * Vérifie si ce produit a des variations.
     */
    public function hasVariations(): bool
    {
        return $this->has_variations && $this->variations()->exists();
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
