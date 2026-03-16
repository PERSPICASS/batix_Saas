<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Depot extends Model
{
    use HasFactory;

    protected $fillable = [
        'code_user',
        'user_id',
        'name',
        'address',
        'city',
        'phone',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function depotProducts(): HasMany
    {
        return $this->hasMany(DepotProduct::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'depot_products')
            ->withPivot('quantity', 'min_stock_alert')
            ->withTimestamps();
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(DepotTransfer::class);
    }

    // Nombre total de produits en stock
    public function getTotalProductsAttribute(): int
    {
        return $this->depotProducts()->sum('quantity');
    }
}
