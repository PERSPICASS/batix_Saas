<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    protected $fillable = [
        'shop_id',
        'customer_id',
        'quote_number',
        'status',
        'quote_date',
        'expiry_date',
        'subtotal',
        'tax_amount',
        'total',
        'notes',
        'terms',
        'sent_at',
        'accepted_at',
    ];

    protected $casts = [
        'quote_date' => 'date',
        'expiry_date' => 'date',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
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

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'accepted');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'sent')
            ->where('expiry_date', '<', now());
    }

    public static function generateNumber($shopId)
    {
        $month = now()->format('Ym');
        $count = Quote::where('shop_id', $shopId)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count() + 1;

        return 'QTE-' . $month . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    public function accept(): void
    {
        $this->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);
    }

    public function convertToInvoice()
    {
        $invoice = Invoice::create([
            'shop_id' => $this->shop_id,
            'customer_id' => $this->customer_id,
            'invoice_number' => Invoice::generateNumber($this->shop_id),
            'quote_id' => $this->id,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total,
            'notes' => $this->notes,
        ]);

        foreach ($this->items as $item) {
            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'product_id' => $item->product_id,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'line_total' => $item->line_total,
            ]);
        }

        return $invoice;
    }
}
