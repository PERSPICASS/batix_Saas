<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_id',
        'user_id',
        'invoice_number',
        'amount',
        'tax',
        'total',
        'status',
        'issued_at',
        'paid_at',
        'due_at',
        'payment_method',
        'metadata',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'due_at' => 'datetime',
        'issued_at' => 'datetime',
        'amount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'metadata' => 'array',
    ];

    /**
     * Get the subscription that owns the invoice.
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if invoice is paid.
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid' && $this->paid_at !== null;
    }

    /**
     * Check if invoice is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if invoice is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status === 'pending' && 
               $this->due_at && 
               $this->due_at->isPast();
    }

    /**
     * Mark invoice as paid.
     */
    public function markAsPaid(?string $transactionId = null, ?string $paymentMethod = null): void
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $paymentMethod ?? $this->payment_method,
        ]);
    }

    /**
     * Mark invoice as failed.
     */
    public function markAsFailed(?string $reason = null): void
    {
        $this->update([
            'status' => 'failed',
        ]);
    }

    /**
     * Generate invoice number.
     */
    public static function generateInvoiceNumber(): string
    {
        $year = now()->year;
        $month = now()->format('m');
        $lastInvoice = self::whereYear('created_at', $year)
                          ->whereMonth('created_at', now()->month)
                          ->orderBy('id', 'desc')
                          ->first();
        
        $sequence = $lastInvoice ? (int) substr($lastInvoice->invoice_number, -4) + 1 : 1;
        
        return sprintf('INV-%s%s-%04d', $year, $month, $sequence);
    }

    /**
     * Scope paid invoices.
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope pending invoices.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope overdue invoices.
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'pending')
                     ->where('due_at', '<', now());
    }
}
