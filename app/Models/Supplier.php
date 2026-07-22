<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
     * Distinct products this supplier has provided.
     *
     * There is no `products.supplier_id` column: a product is tied to a
     * supplier only through purchase orders (supplier → purchases →
     * purchase_items → product). This returns a Product query, so callers
     * can `->get()`, `->count()` or `->exists()` on it as needed.
     */
    public function products(): Builder
    {
        return Product::query()->whereIn('id', function ($query) {
            $query->select('purchase_items.product_id')
                ->from('purchase_items')
                ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
                ->where('purchases.supplier_id', $this->id);
        });
    }

    /**
     * Get the purchases for this supplier.
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }
}
