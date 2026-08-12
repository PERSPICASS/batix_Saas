<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketingCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'channel',
        'status',
        'objective',
        'audience',
        'offer',
        'daily_budget',
        'start_date',
        'end_date',
        'metrics',
    ];

    protected $casts = [
        'daily_budget' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'metrics' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contents(): HasMany
    {
        return $this->hasMany(MarketingContent::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(MarketingLead::class);
    }
}
