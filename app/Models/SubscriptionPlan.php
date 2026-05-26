<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'max_shops',
        'max_users',
        'max_products',
        'max_depots',
        'features',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    protected $appends = [
        'formatted_price',
        'price_eur',
        'price_fcfa',
        'shop_limit_text',
    ];

    /**
     * Get the subscriptions for the plan.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get active subscriptions count.
     */
    public function activeSubscriptionsCount(): int
    {
        return $this->subscriptions()->where('status', 'active')->count();
    }

    /**
     * Check if plan allows unlimited shops.
     */
    public function hasUnlimitedShops(): bool
    {
        return $this->max_shops === -1;
    }

    /**
     * Check if plan allows unlimited users.
     */
    public function hasUnlimitedUsers(): bool
    {
        return $this->max_users === -1;
    }

    public function hasUnlimitedProducts(): bool
    {
        return $this->max_products === -1;
    }

    public function hasUnlimitedDepots(): bool
    {
        return $this->max_depots === -1;
    }

    /**
     * Get formatted price.
     */
    public function getFormattedPriceAttribute(): string
    {
        $eurToXafRate = 655.957;
        $price = (float) ($this->price ?? 0);
        $priceInEur = $price / $eurToXafRate;

        $fcfa = number_format($price, 0, ',', ' ') . ' FCFA';
        $eur = number_format($priceInEur, 0, ',', ' ') . '€';

        return $eur . '<br>' . $fcfa;
    }

    /**
     * Get price in EUR.
     */
    public function getPriceEurAttribute(): string
    {
        $eurToXafRate = 655.957;
        $price = (float) ($this->price ?? 0);
        $priceInEur = $price / $eurToXafRate;
        return number_format($priceInEur, 0, ',', ' ') . '€';
    }

    /**
     * Get price in FCFA.
     */
    public function getPriceFcfaAttribute(): ?string
    {
        $price = (float) ($this->price ?? 0);
        if ($price == 0) {
            return null;
        }

        return number_format($price, 0, ',', ' ') . ' FCFA';
    }

    /**
     * Get shop limit text.
     */
    public function getShopLimitTextAttribute(): string
    {
        return $this->hasUnlimitedShops() ? 'Illimité' : $this->max_shops . ' boutique' . ($this->max_shops > 1 ? 's' : '');
    }
}
