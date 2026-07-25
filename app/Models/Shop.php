<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Shop extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'address',
        'city',
        'postal_code',
        'country',
        'phone',
        'email',
        'website',
        'logo',
        'tax_id',
        'currency',
        'default_tax_rate',
        'invoice_prefix',
        'invoice_footer',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($shop) {
            if (empty($shop->slug)) {
                $shop->slug = Str::slug($shop->name);
            }
        });
    }

    /**
     * La devise qu'une nouvelle boutique doit adopter.
     *
     * Celle que le super_admin a paramétrée dans les Réglages, pas le défaut de la base.
     * `shops.currency` vaut `MAD` par défaut en base : une boutique supplémentaire créée
     * sans devise explicite repartait donc sur le Maroc, quel que soit le pays du compte
     * et quoi qu'ait réglé son propriétaire.
     *
     * La boutique de rattachement de l'utilisateur fait foi ; à défaut, la dernière créée
     * du compte. Un compte tout neuf n'a rien à hériter — d'où USD en dernier recours,
     * ajustable ensuite dans les Réglages.
     */
    public static function defaultCurrencyFor(User $user): string
    {
        $own = $user->shop_id
            ? static::whereKey($user->shop_id)->value('currency')
            : null;

        return $own
            ?: $user->accessibleShopsQuery()->orderByDesc('id')->value('currency')
            ?: 'USD';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
