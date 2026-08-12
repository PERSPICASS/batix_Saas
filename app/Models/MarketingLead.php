<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingLead extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'marketing_campaign_id',
        'name',
        'phone',
        'company',
        'business_type',
        'source',
        'status',
        'score',
        'notes',
        'last_contact_at',
    ];

    protected $casts = [
        'last_contact_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(MarketingCampaign::class, 'marketing_campaign_id');
    }
}
