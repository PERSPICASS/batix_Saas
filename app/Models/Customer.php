<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'name',
        'email',
        'phone',
        'address',
        'notes',
        'is_active',
        'total_purchases',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'total_purchases' => 'decimal:2',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    /**
     * Net des avoirs : sans cette soustraction, créditer une facture payée laisserait le
     * client crédité de la totalité de son achat, alors qu'on vient de lui en rendre une
     * partie. Les avoirs des factures non payées ne sont pas déduits, puisque ces
     * factures ne sont pas comptées non plus.
     */
    public function updateTotalPurchases(): void
    {
        $paidInvoiceIds = $this->invoices()->where('status', 'paid')->pluck('id');

        $invoiced = (float) $this->invoices()->whereIn('id', $paidInvoiceIds)->sum('total');
        $credited = (float) CreditNote::whereIn('invoice_id', $paidInvoiceIds)->sum('total');

        $this->total_purchases = $invoiced - $credited;

        $this->save();
    }
}
