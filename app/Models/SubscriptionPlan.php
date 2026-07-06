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
        'paddle_price_id',
        'paddle_price_id_yearly',
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
        'price_eur_yearly',
        'price_fcfa_yearly',
        'shop_limit_text',
    ];

    /**
     * Get the route key for model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

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

    /**
     * Get yearly price in EUR (×10 monthly price = 2 months free, same
     * convention as the billing-cycle toggle in Payment/Checkout.tsx).
     */
    public function getPriceEurYearlyAttribute(): string
    {
        $eurToXafRate = 655.957;
        $priceYearly = (float) ($this->price ?? 0) * 10;
        return number_format($priceYearly / $eurToXafRate, 0, ',', ' ') . '€';
    }

    /**
     * Get yearly price in FCFA (×10 monthly price).
     */
    public function getPriceFcfaYearlyAttribute(): ?string
    {
        $price = (float) ($this->price ?? 0);
        if ($price == 0) {
            return null;
        }

        return number_format($price * 10, 0, ',', ' ') . ' FCFA';
    }

    /**
     * Active paid plans formatted for the public marketing pages (Welcome, Tarifs).
     */
    public static function activePublicPlans(): \Illuminate\Support\Collection
    {
        return static::where('is_active', true)
            ->orderBy('price', 'asc')
            ->get()
            ->map(fn (self $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price' => $plan->price,
                'formatted_price' => $plan->formatted_price,
                'price_eur' => $plan->price_eur,
                'price_fcfa' => $plan->price_fcfa,
                'price_eur_yearly' => $plan->price_eur_yearly,
                'price_fcfa_yearly' => $plan->price_fcfa_yearly,
                'max_shops' => $plan->max_shops,
                'max_users' => $plan->max_users,
                'max_products' => $plan->max_products,
                'max_depots' => $plan->max_depots,
                'features' => $plan->features,
                'shop_limit_text' => $plan->shop_limit_text,
                'has_unlimited_shops' => $plan->hasUnlimitedShops(),
                'has_unlimited_users' => $plan->hasUnlimitedUsers(),
                'has_unlimited_products' => $plan->hasUnlimitedProducts(),
                'has_unlimited_depots' => $plan->hasUnlimitedDepots(),
            ]);
    }
}
