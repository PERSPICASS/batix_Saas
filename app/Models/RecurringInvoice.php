<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecurringInvoice extends Model
{
    protected $fillable = [
        'shop_id',
        'customer_id',
        'user_id',
        'invoice_prefix',
        'subtotal',
        'tax_amount',
        'total',
        'notes',
        'frequency',
        'start_date',
        'end_date',
        'next_invoice_date',
        'last_generated_at',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'next_invoice_date' => 'date',
        'last_generated_at' => 'datetime',
        'is_active' => 'boolean',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

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
        return $this->hasMany(RecurringInvoiceItem::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function generateNextInvoice(): Invoice
    {
        $invoice = Invoice::create([
            'shop_id' => $this->shop_id,
            'customer_id' => $this->customer_id,
            'user_id' => $this->user_id,
            'invoice_number' => Invoice::generateInvoiceNumber($this->shop_id),
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'notes' => $this->notes,
        ]);

        foreach ($this->items as $item) {
            \App\Models\InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'tax_rate' => $item->tax_rate,
                'discount_amount' => $item->discount_amount,
            ]);
        }

        $this->update([
            'last_generated_at' => now(),
            'next_invoice_date' => $this->calculateNextInvoiceDate(),
        ]);

        return $invoice;
    }

    public function calculateNextInvoiceDate()
    {
        return match($this->frequency) {
            'monthly' => $this->next_invoice_date->addMonth(),
            'quarterly' => $this->next_invoice_date->addQuarters(1),
            'semi-annual' => $this->next_invoice_date->addMonths(6),
            'annual' => $this->next_invoice_date->addYear(),
        };
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeExpired($query)
    {
        return $query->whereNotNull('end_date')
            ->where('end_date', '<', now());
    }
}
