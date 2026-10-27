<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        // User::activeSubscription() is memoised per request: any change to a
        // subscription must be visible to the rest of the same request.
        $forget = fn (Subscription $s) => User::activeSubscriptionMemo()?->remove("active_subscription.{$s->user_id}");

        static::saved($forget);
        static::deleted($forget);
    }

    protected $fillable = [
        'user_id',
        'subscription_plan_id',
        'status',
        'started_at',
        'expires_at',
        'cancelled_at',
        'trial_ends_at',
        'amount',
        'billing_cycle',
        'metadata',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'trial_ends_at' => 'datetime',
        'metadata' => 'array',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the user that owns the subscription.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subscription plan.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    /**
     * Get the invoices for the subscription.
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(SubscriptionInvoice::class);
    }

    /**
     * Une limite accordée à la main à CET essai (`metadata.limits`), au-dessus de son plan.
     *
     * Seul un essai en profite : un abonnement payé suit son plan, et la dérogation ne doit
     * pas survivre au passage en payant — elle ne ferait alors que brider un plan supérieur.
     * Posée par `subscription:grant-trial-limits`.
     */
    public function trialLimit(string $key): ?int
    {
        if ($this->status !== 'trial') {
            return null;
        }

        $value = $this->metadata['limits'][$key] ?? null;

        return $value === null ? null : (int) $value;
    }

    public function maxShops(): int
    {
        return $this->trialLimit('max_shops') ?? $this->plan->max_shops;
    }

    /** Collaborateurs par boutique, propriétaire non compris ; null si aucune dérogation. */
    public function maxUsersPerShop(): ?int
    {
        return $this->trialLimit('max_users_per_shop');
    }

    /**
     * Check if subscription is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && 
               ($this->expires_at === null || $this->expires_at->isFuture());
    }

    /**
     * Check if subscription is on trial.
     */
    public function onTrial(): bool
    {
        return $this->status === 'trial' && 
               $this->trial_ends_at && 
               $this->trial_ends_at->isFuture();
    }

    /**
     * Check if subscription is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Check if subscription is expired.
     */
    public function isExpired(): bool
    {
        return $this->status === 'expired' || 
               ($this->expires_at && $this->expires_at->isPast());
    }

    /**
     * Cancel the subscription.
     */
    public function cancel(): void
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }

    /**
     * Renew the subscription.
     */
    public function renew(int $months = 1): void
    {
        // Extends from the current end date when it is still ahead, so the
        // subscriber keeps the days they already paid for.
        $base = $this->expires_at && $this->expires_at->isFuture()
            ? $this->expires_at->copy()
            : now();

        $this->update([
            'status' => 'active',
            'started_at' => $this->started_at ?? now(),
            'cancelled_at' => null,
            'expires_at' => $base->addMonths($months),
        ]);
    }

    /**
     * Get days until expiration.
     */
    public function daysUntilExpiration(): ?int
    {
        if (!$this->expires_at) {
            return null;
        }

        return now()->diffInDays($this->expires_at, false);
    }

    /**
     * Scope active subscriptions.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                     ->where(function($q) {
                         $q->whereNull('expires_at')
                           ->orWhere('expires_at', '>', now());
                     });
    }

    /**
     * Scope expiring soon (within days).
     */
    public function scopeExpiringSoon($query, int $days = 7)
    {
        return $query->where('status', 'active')
                     ->whereNotNull('expires_at')
                     ->whereBetween('expires_at', [now(), now()->addDays($days)]);
    }

    /**
     * Check if subscription has access to AI Assistant.
     */
    public function hasAiAssistant(): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        // AI Assistant is available on Growth, Pro, and Enterprise plans
        $allowedPlans = ['growth', 'pro', 'enterprise'];
        return in_array($this->plan->slug, $allowedPlans);
    }
}
