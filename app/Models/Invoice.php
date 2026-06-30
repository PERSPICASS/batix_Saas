<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'customer_id',
        'user_id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'status',
        'payment_method',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total',
        'notes',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($invoice) {
            if (!$invoice->invoice_number) {
                $invoice->invoice_number = static::generateInvoiceNumber($invoice->shop_id);
            }
        });
        
        static::saved(function ($invoice) {
            if ($invoice->status === 'paid' && $invoice->wasChanged('status')) {
                $invoice->customer->updateTotalPurchases();
            }
        });
    }

    public static function generateInvoiceNumber($shopId): string
    {
        $year = date('Y');
        $month = date('m');
        $prefix = "INV-{$year}{$month}";
        
        $lastInvoice = static::where('shop_id', $shopId)
            ->where('invoice_number', 'like', "{$prefix}%")
            ->orderBy('invoice_number', 'desc')
            ->first();
        
        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->invoice_number, -4);
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum('total');
        $this->tax_amount = $this->items->sum('tax_amount');
        $this->total = $this->subtotal + $this->tax_amount - $this->discount_amount;
        $this->save();
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function toRecurringInvoice(string $frequency = 'monthly', ?\DateTime $startDate = null, ?\DateTime $endDate = null): RecurringInvoice
    {
        $this->load('items');

        $recurringInvoice = RecurringInvoice::create([
            'shop_id' => $this->shop_id,
            'customer_id' => $this->customer_id,
            'user_id' => $this->user_id,
            'invoice_prefix' => 'REC-' . now()->format('Ym'),
            'start_date' => ($startDate ?? now())->toDateString(),
            'end_date' => $endDate?->toDateString(),
            'frequency' => $frequency,
            'next_invoice_date' => ($startDate ?? now())->toDateString(),
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'notes' => $this->notes,
            'is_active' => true,
        ]);

        foreach ($this->items as $item) {
            $recurringInvoice->items()->create([
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'tax_rate' => $item->tax_rate,
                'discount_amount' => $item->discount_amount,
            ]);
        }

        return $recurringInvoice;
    }
}
