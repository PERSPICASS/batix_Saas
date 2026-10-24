<?php

namespace App\Models;

use App\Support\DocumentNumber;
use App\Support\ConcurrencySafe;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use App\Traits\BelongsToShop;

class Quote extends Model
{
    use BelongsToShop;

    protected $fillable = [
        'shop_id',
        'customer_id',
        'user_id',
        'quote_number',
        'status',
        'quote_date',
        'expiry_date',
        'subtotal',
        'tax_amount',
        'total',
        'notes',
        'terms',
        'show_unit_prices',
        'show_amounts',
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
        'show_unit_prices' => 'boolean',
        'show_amounts' => 'boolean',
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

    /**
     * One past the highest number issued this month in the shop. It used to COUNT the
     * month's quotes: a draft quote can be deleted, the count went down and the next
     * quote got a number already in use — and since every retry recounted the same,
     * creating a quote kept failing.
     */
    public static function generateNumber($shopId)
    {
        return DocumentNumber::next(Quote::where('shop_id', $shopId), 'quote_number', 'QTE-' . now()->format('Ym') . '-', 3);
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
        return ConcurrencySafe::retryOnDuplicate(function () {
            return DB::transaction(function () {
                $invoice = Invoice::create([
                    'shop_id' => $this->shop_id,
                    'customer_id' => $this->customer_id,
                    'user_id' => auth()->id(),
                    'invoice_date' => now()->toDateString(),
                    'due_date' => now()->addDays(30)->toDateString(),
                    'status' => 'draft',
                    'subtotal' => $this->subtotal,
                    'tax_amount' => $this->tax_amount,
                    'total' => $this->total,
                    'notes' => $this->notes,
                ]);

                foreach ($this->items as $item) {
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product->name,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'tax_rate' => $item->tax_rate,
                        'discount_amount' => 0,
                    ]);
                }

                return $invoice;
            });
        });
    }
}
