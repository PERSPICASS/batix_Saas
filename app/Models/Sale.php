<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'user_id',
        'customer_id',
        'ticket_number',
        'sale_date',
        'payment_method',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total',
        'amount_paid',
        'change_amount',
        'remaining_amount',
        'credit_due_date',
        'notes',
    ];

    protected $casts = [
        'sale_date' => 'datetime',
        'credit_due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($sale) {
            if (!$sale->ticket_number) {
                $sale->ticket_number = static::generateTicketNumber($sale->shop_id);
            }
            if (!$sale->sale_date) {
                $sale->sale_date = now();
            }
        });
    }

    public static function generateTicketNumber($shopId): string
    {
        $date = date('Ymd');
        $prefix = "TKT-{$date}";
        
        $lastSale = static::where('shop_id', $shopId)
            ->where('ticket_number', 'like', "{$prefix}%")
            ->orderBy('ticket_number', 'desc')
            ->first();
        
        if ($lastSale) {
            $lastNumber = (int) substr($lastSale->ticket_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum('total');
        $this->tax_amount = $this->items->sum('tax_amount');
        $this->total = $this->subtotal + $this->tax_amount - $this->discount_amount;
        $this->change_amount = $this->amount_paid - $this->total;
        $this->save();
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCredit(): bool
    {
        return $this->remaining_amount > 0;
    }

    public function isOverdue(): bool
    {
        return $this->isCredit()
            && $this->credit_due_date
            && $this->credit_due_date->isPast();
    }

    public function isReturned(): bool
    {
        return $this->status === 'returned';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function canBeReturned(): bool
    {
        return $this->status === 'completed' && 
               $this->sale_date->diffInDays(now()) <= 30; // Retour possible dans les 30 jours
    }
}
