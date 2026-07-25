<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Services\StockMovementService;
use App\Support\GlobalDiscount;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'shop_id',
        'customer_id',
        'user_id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'status',
        'stock_released_at',
        'payment_method',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total',
        'notes',
        'recurring_invoice_id',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'stock_released_at' => 'datetime',
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
            if ($invoice->status !== 'paid') {
                return;
            }

            // `wasChanged()` ne dit jamais rien à l'insertion : syncChanges() n'est appelé
            // que par performUpdate(). Une facture créée directement en `paid` — ce que
            // store() autorise — ne mettait donc jamais à jour le total du client.
            // Le total est également surveillé, parce que les observers de lignes
            // recalculent la facture APRÈS sa création : sans cela, le total du client
            // resterait figé sur le montant envoyé par le formulaire.
            if ($invoice->wasRecentlyCreated || $invoice->wasChanged('status') || $invoice->wasChanged('total')) {
                $invoice->customer->updateTotalPurchases();
            }
        });
    }

    /**
     * `withTrashed()` est ce qui empêche la réattribution d'un numéro : le numéro est
     * calculé à partir du plus élevé déjà émis, donc ignorer les factures annulées
     * reviendrait à redonner leur numéro à la facture suivante. Deux documents
     * distincts porteraient la même identité — et la contrainte unique
     * [shop_id, invoice_number] ne pourrait rien y faire puisqu'elle voit, elle, la
     * ligne conservée. Un trou dans la séquence est le comportement voulu.
     */
    public static function generateInvoiceNumber($shopId): string
    {
        $year = date('Y');
        $month = date('m');
        $prefix = "INV-{$year}{$month}";

        $lastInvoice = static::withTrashed()
            ->where('shop_id', $shopId)
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

    public function recurringInvoice(): BelongsTo
    {
        return $this->belongsTo(RecurringInvoice::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function creditNotes(): HasMany
    {
        return $this->hasMany(CreditNote::class);
    }

    /**
     * Montant déjà crédité par avoir. La facture, elle, n'est jamais retouchée : c'est la
     * somme des avoirs qui vient s'y opposer.
     */
    public function creditedTotal(): float
    {
        return (float) $this->creditNotes()->sum('total');
    }

    /**
     * Ce que la facture représente réellement, avoirs déduits.
     */
    public function netTotal(): float
    {
        return round((float) $this->total - $this->creditedTotal(), 2);
    }

    /**
     * Une facture n'est créditable que si elle a été émise et pas annulée — un brouillon
     * n'a rien produit à corriger, une facture annulée n'a jamais rien valu — et s'il
     * reste au moins une ligne dont la quantité n'est pas intégralement créditée.
     */
    public function isCreditable(): bool
    {
        if (!in_array($this->status, ['sent', 'paid'], true)) {
            return false;
        }

        return $this->items->contains(fn ($item) => $item->quantityCreditable() > 0);
    }

    /**
     * Sortir la marchandise du stock, une seule fois.
     *
     * Appelée à l'émission — pas à la création des lignes : un brouillon se modifie
     * librement et ses lignes sont détruites puis recréées à chaque enregistrement, si bien
     * qu'une sortie à ce moment décrémenterait à chaque passage.
     *
     * `stock_released_at` rend l'appel idempotent : émettre puis marquer payée ne sort la
     * marchandise qu'une fois, quel que soit le nombre d'appels.
     *
     * Les factures récurrentes en sont exclues. Elles rebillent un contrat à chaque
     * échéance ; décrémenter à chaque fois viderait le stock d'un produit jamais livré.
     *
     * @throws ValidationException si le stock ne suffit pas.
     */
    public function releaseStock(): void
    {
        // La garde est ici et pas seulement chez les appelants : une facture non émise
        // n'a rien livré, et un futur appel mal placé ne doit pas pouvoir vider le stock
        // sur un brouillon.
        if (!in_array($this->status, ['sent', 'paid'], true)) {
            return;
        }

        if ($this->stock_released_at !== null || $this->recurring_invoice_id !== null) {
            return;
        }

        DB::transaction(function () {
            $needed = [];
            foreach ($this->items as $item) {
                if ($item->product_id) {
                    $needed[$item->product_id] = ($needed[$item->product_id] ?? 0) + (int) $item->quantity;
                }
            }

            if (empty($needed)) {
                $this->forceFill(['stock_released_at' => now()])->save();

                return;
            }

            // Verrouiller avant de vérifier : deux émissions simultanées de la dernière
            // pièce passeraient sinon toutes deux le contrôle. Même garde que la vente au
            // comptoir (SaleCreationService).
            $products = Product::whereIn('id', array_keys($needed))->lockForUpdate()->get()->keyBy('id');

            $errors = [];
            foreach ($needed as $productId => $quantity) {
                $product = $products->get($productId);

                if ($product && $product->track_stock && $product->stock_quantity < $quantity) {
                    $errors['stock'][] = "Stock insuffisant pour « {$product->name} » (disponible : {$product->stock_quantity}, demandé : {$quantity}).";
                }
            }

            if (!empty($errors)) {
                throw ValidationException::withMessages($errors);
            }

            foreach ($needed as $productId => $quantity) {
                if ($product = $products->get($productId)) {
                    StockMovementService::recordInvoiceIssue($product, $quantity, $this->shop_id, $this);
                }
            }

            $this->forceFill(['stock_released_at' => now()])->save();
        });
    }

    /**
     * Remettre en stock une facture annulée qui l'avait sorti.
     *
     * La marchandise n'a pas été vendue : la garder sortie fausserait l'inventaire.
     */
    public function restoreStock(): void
    {
        if ($this->stock_released_at === null) {
            return;
        }

        DB::transaction(function () {
            foreach ($this->items as $item) {
                if (!$item->product_id || !$item->product) {
                    continue;
                }

                StockMovementService::recordInvoiceCancellation(
                    $item->product,
                    (int) $item->quantity,
                    $this->shop_id,
                    $this
                );
            }

            $this->forceFill(['stock_released_at' => null])->save();
        });
    }

    public function calculateTotals(): void
    {
        // item.total est TTC (subtotal + tax_amount, voir InvoiceItem::saving()) : soustraire
        // la taxe de chaque ligne pour obtenir un sous-total HT, sans quoi la taxe était
        // comptée deux fois dans le total de la facture.
        $subtotal = (float) $this->items->sum(fn ($item) => $item->total - $item->tax_amount);
        $grossTax = (float) $this->items->sum('tax_amount');

        // La remise du document réduit la base imposable : elle était auparavant retranchée
        // du TTC, après la TVA, ce qui surévaluait la taxe déclarée.
        $discount = GlobalDiscount::effective($subtotal, $this->discount_amount);
        $tax = round($grossTax * GlobalDiscount::ratio($subtotal, $discount), 2);

        // `subtotal` reste la base AVANT remise : c'est ce qu'attend le document imprimé,
        // qui affiche le sous-total puis la remise sur deux lignes distinctes.
        $this->subtotal = $subtotal;
        $this->tax_amount = $tax;
        $this->total = round($subtotal - $discount + $tax, 2);
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
