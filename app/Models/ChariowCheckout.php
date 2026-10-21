<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChariowCheckout extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'user_id',
        'subscription_plan_id',
        'billing_cycle',
        'status',
        'sale_id',
        'transaction_id',
        'chariow_product_id',
        'amount',
        'currency',
        'subscription_activated',
        'checkout_url',
        'metadata',
        'completed_at',
    ];

    protected $casts = [
        'amount'                 => 'decimal:2',
        'subscription_activated' => 'boolean',
        'metadata'               => 'array',
        'completed_at'           => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }
}
