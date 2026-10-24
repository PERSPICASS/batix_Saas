<?php

namespace App\Models;

use App\Support\DocumentNumber;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Support\GlobalDiscount;
use App\Traits\BelongsToShop;

class Sale extends Model
{
    use BelongsToShop, HasFactory;

    protected $fillable = [
        'shop_id',
        'user_id',
        'customer_id',
        'ticket_number',
        // Généré par le client hors ligne : rend le rejeu d'une vente en file d'attente
        // idempotent. Voir la migration add_client_uuid_to_sales_table.
        'client_uuid',
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
        $prefix = 'TKT-'.date('Ymd');

        // Per shop since 2026-10-15 (unique on shop_id + ticket_number, like invoices).
        // It used to be one counter shared by every tenant, 4 digits a day, found by
        // sorting the strings: past 9999 sales a day platform-wide, "…10000" sorts
        // below "…9999", the same number came back forever and every sale of every
        // shop failed until midnight. The max is now taken numerically, so a busy
        // shop simply goes to 5 digits.
        return DocumentNumber::next(static::where('shop_id', $shopId), 'ticket_number', $prefix);
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
        // item.total est TTC (subtotal + tax_amount, voir SaleItem::saving()) : soustraire
        // la taxe de chaque ligne pour obtenir un sous-total HT, sans quoi la taxe était
        // comptée deux fois dans le total de la vente.
        $this->subtotal = $this->items->sum(fn ($item) => $item->total - $item->tax_amount);

        // Même règle que SaleCreationService : la remise réduit la base imposable.
        // Ce recalcul tourne à l'enregistrement de chaque ligne, donc APRÈS le
        // service, et retranchait encore la remise du TTC : toute vente remisée sur
        // un produit taxé repartait avec une TVA et un total surévalués, une monnaie
        // rendue négative, et un reste dû calculé sur l'ancien total.
        //
        // La remise bornée sert au calcul mais n'est jamais réécrite : ce recalcul
        // tourne après CHAQUE ligne, donc sur un sous-total encore partiel. L'écrire
        // ramenait une remise de 80 sur deux lignes de 50 à 50 dès la première ligne,
        // définitivement. La remise stockée est celle demandée, déjà bornée au
        // sous-total complet par SaleCreationService (comme Invoice::calculateTotals).
        $discount = GlobalDiscount::effective((float) $this->subtotal, (float) $this->discount_amount);
        $this->tax_amount = round($this->items->sum('tax_amount') * GlobalDiscount::ratio((float) $this->subtotal, $discount), 2);
        $this->total = round($this->subtotal - $discount + $this->tax_amount, 2);
        $this->change_amount = max(0, $this->amount_paid - $this->total);
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
