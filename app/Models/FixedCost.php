<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FixedCost extends Model
{
    protected $fillable = [
        'name',
        'category',
        'amount_monthly',
        'description',
        'is_active',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'amount_monthly' => 'decimal:2',
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getTotalMonthlyAttribute()
    {
        return $this->active()->sum('amount_monthly');
    }
}
