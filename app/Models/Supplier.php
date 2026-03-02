<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'company_name',
        'email',
        'phone',
        'mobile',
        'address',
        'city',
        'postal_code',
        'country',
        'tax_id',
        'website',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the shops associated with the supplier.
     */
    public function shops(): BelongsToMany
    {
        return $this->belongsToMany(Shop::class, 'shop_supplier')->withTimestamps();
    }

    /**
     * Get the products supplied by this supplier.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the purchases for this supplier.
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }
}
