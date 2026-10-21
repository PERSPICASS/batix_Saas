<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JekoPaymentRequest extends Model
{
    protected $table = 'jeko_payment_requests';

    protected $fillable = [
        'payment_request_id',
        'user_id',
        'subscription_plan_id',
        'billing_cycle',
        'amount_cents',
        'currency',
        'payment_method',
        'reference',
        'status',
        'subscription_activated',
        'redirect_url',
        'metadata',
        'completed_at',
    ];

    protected $casts = [
        'metadata'                => 'array',
        'subscription_activated'  => 'boolean',
        'completed_at'            => 'datetime',
        'payment_request_id'      => 'string',
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
        return in_array($this->status, ['success', 'error']);
    }
}
