<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Two kinds of categories coexist (decided 2026-10-15):
 * - global ones (shop_id NULL): the shared BATIX catalogue, visible to every
 *   account and managed by the platform only;
 * - per-shop ones: created by a shop, visible to and managed by that shop's
 *   account only.
 * Never list categories without visibleTo(): a bare Category::all() shows
 * every tenant's categories to everyone.
 */
class Category extends Model
{
    use HasFactory;
    protected $fillable = [
        'shop_id',
        'name',
        'slug',
        'description',
        'color',
        'icon',
        'is_active',
        'order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });

        static::updating(function ($category) {
            if ($category->isDirty('name') && empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function subcategories(): HasMany
    {
        return $this->hasMany(Subcategory::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /** Global categories + those of the shops the user can access. */
    public function scopeVisibleTo($query, User $user)
    {
        return $query->where(fn ($q) => $q
            ->whereNull('categories.shop_id')
            ->orWhereIn('categories.shop_id', $user->accessibleShopsQuery()->select('shops.id')));
    }

    /** Only the user's own shops' categories: globals are read-only to tenants. */
    public function scopeManagedBy($query, User $user)
    {
        return $query->whereIn('categories.shop_id', $user->accessibleShopsQuery()->select('shops.id'));
    }

    public function isVisibleTo(User $user): bool
    {
        return $this->shop_id === null || $this->isManagedBy($user);
    }

    public function isManagedBy(User $user): bool
    {
        return $this->shop_id !== null
            && $user->accessibleShopsQuery()->whereKey($this->shop_id)->exists();
    }
}
