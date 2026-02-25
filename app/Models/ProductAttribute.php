<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ProductAttribute extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'name',
        'slug',
        'order',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($attribute) {
            if (empty($attribute->slug)) {
                $attribute->slug = Str::slug($attribute->name);
            }
        });
    }

    /**
     * La boutique à laquelle appartient cet attribut.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Les valeurs de cet attribut.
     */
    public function values(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class, 'attribute_id')->orderBy('order');
    }
}
