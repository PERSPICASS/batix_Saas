<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'product_id',
        'product_article_id',
        'product_name',
        'article_name',
        'description',
        'quantity',
        'unit_price',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function creditNoteItems(): HasMany
    {
        return $this->hasMany(CreditNoteItem::class);
    }

    /**
     * Quantité déjà créditée sur cette ligne, tous avoirs confondus.
     */
    public function quantityCredited(): int
    {
        return (int) $this->creditNoteItems()->sum('quantity');
    }

    /**
     * Ce qu'il reste créditable. C'est la borne qu'un avoir ne peut pas franchir : sans
     * elle, deux avoirs successifs pourraient rembourser plus que ce qui a été facturé.
     */
    public function quantityCreditable(): int
    {
        return max(0, $this->quantity - $this->quantityCredited());
    }

    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($item) {
            // Calculer le montant de la taxe
            $subtotal = ($item->unit_price * $item->quantity) - $item->discount_amount;
            $item->tax_amount = $subtotal * ($item->tax_rate / 100);
            $item->total = $subtotal + $item->tax_amount;
        });
        
        static::saved(function ($item) {
            $item->invoice->calculateTotals();
        });
        
        static::deleted(function ($item) {
            $item->invoice->calculateTotals();
        });
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productArticle(): BelongsTo
    {
        return $this->belongsTo(ProductArticle::class);
    }
}
