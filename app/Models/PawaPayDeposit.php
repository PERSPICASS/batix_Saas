<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PawaPayDeposit extends Model
{
    protected $fillable = [
        'deposit_id',
        'user_id',
        'subscription_plan_id',
        'billing_cycle',
        'amount',
        'currency',
        'correspondent',
        'msisdn',
        'status',
        'subscription_activated',
        'metadata',
        'completed_at',
    ];

    protected $casts = [
        'metadata'                 => 'array',
        'amount'                   => 'decimal:2',
        'subscription_activated'   => 'boolean',
        'completed_at'             => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, ['COMPLETED', 'FAILED', 'DUPLICATE_IGNORED']);
    }
}
