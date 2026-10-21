<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LemonSqueezyProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_plan_id',
        'lemon_product_id',
        'lemon_variant_id',
        'name',
        'description',
        'price',
        'currency',
        'product_data',
        'variant_data',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'product_data' => 'array',
        'variant_data' => 'array',
    ];

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }
}
