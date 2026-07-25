<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Un avoir corrige une facture émise sans la modifier.
 *
 * Immuable par construction : CreditNoteController n'expose ni edit(), ni update(), ni
 * destroy() — même parti pris que Sale, et pour la même raison. Se tromper dans un avoir
 * se corrige en émettant une facture, pas en réécrivant l'avoir.
 */
class CreditNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'invoice_id',
        'customer_id',
        'user_id',
        'credit_note_number',
        'credit_note_date',
        'reason',
        'notes',
        'subtotal',
        'tax_amount',
        'total',
    ];

    protected $casts = [
        'credit_note_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($creditNote) {
            if (!$creditNote->credit_note_number) {
                $creditNote->credit_note_number = static::generateNumber($creditNote->shop_id);
            }
        });

        // Le total du client est net des avoirs : sans cela, créditer une facture payée
        // laisserait le client crédité de la totalité de son achat.
        static::saved(fn ($creditNote) => $creditNote->customer?->updateTotalPurchases());
    }

    /**
     * Comme pour les factures, le numéro se déduit du plus élevé déjà émis dans la
     * boutique pour le mois courant. Un avoir ne se supprimant jamais, aucun numéro ne
     * peut revenir en circulation.
     */
    public static function generateNumber($shopId): string
    {
        $prefix = 'AV-' . date('Ym');

        $last = static::where('shop_id', $shopId)
            ->where('credit_note_number', 'like', "{$prefix}%")
            ->orderBy('credit_note_number', 'desc')
            ->first();

        $next = $last ? ((int) substr($last->credit_note_number, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
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
        return $this->hasMany(CreditNoteItem::class);
    }

    /**
     * Recalcule les totaux depuis les lignes. Appelé après leur création, la logique de
     * taxe par ligne étant la même que sur une facture.
     */
    public function calculateTotals(): void
    {
        $items = $this->items()->get();

        $subtotal = $items->sum(fn ($item) => (float) $item->total);
        $tax = $items->sum(fn ($item) => (float) $item->total * ((float) $item->tax_rate / 100));

        $this->update([
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'total' => $subtotal + $tax,
        ]);
    }
}
