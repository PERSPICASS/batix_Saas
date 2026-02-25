<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class ProductAttributeValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'attribute_id',
        'value',
        'slug',
        'order',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($value) {
            if (empty($value->slug)) {
                $value->slug = Str::slug($value->value);
            }
        });
    }

    /**
     * L'attribut parent de cette valeur.
     */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(ProductAttribute::class, 'attribute_id');
    }

    /**
     * Les produits (variations) qui utilisent cette valeur d'attribut.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_variation_attributes', 'attribute_value_id', 'product_id');
    }
}
