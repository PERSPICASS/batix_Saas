<?php

namespace App\Models;

use App\Support\GlobalDiscount;
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
        'unit_cost',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'unit_cost' => 'decimal:2',
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
    /**
     * Ce qu'une unité de cette ligne a réellement été facturée, hors taxes : remise de la
     * ligne déduite, puis sa part de la remise de la facture. C'est le prix qu'un avoir
     * crédite — il créditait le prix catalogue, donc plus que ce qui avait été facturé, et
     * plus que l'avoir certifié par la FNE, qui ne reçoit que les quantités et recalcule le
     * montant depuis la facture.
     */
    public function creditableUnitPrice(): float
    {
        if ((int) $this->quantity <= 0) {
            return 0.0;
        }

        $lineExclTax = (float) $this->total - (float) $this->tax_amount;
        $invoice = $this->invoice;

        return $lineExclTax / (int) $this->quantity
            * GlobalDiscount::ratio((float) $invoice->subtotal, (float) $invoice->discount_amount);
    }

    public function quantityCreditable(): int
    {
        return max(0, $this->quantity - $this->quantityCredited());
    }

    protected static function boot()
    {
        parent::boot();
        
        // Le coût d'achat du jour, figé sur la ligne : la marge d'une vente passée ne doit pas
        // changer quand le coût moyen du produit bouge ensuite (achat plus cher ou moins cher).
        static::creating(function ($item) {
            if ($item->unit_cost === null && $item->product_id) {
                $item->unit_cost = Product::find($item->product_id)?->unitCost();
            }
        });

        static::saving(function ($item) {
            // tax_rate et discount_amount sont NOT NULL DEFAULT 0 en base. Un défaut SQL
            // ne s'applique qu'à une colonne ABSENTE de l'INSERT, jamais à un null
            // explicite — or c'est exactement ce qui arrivait ici : la validation les
            // accepte en `nullable`, et ConvertEmptyStringsToNull transforme en null le
            // champ que l'utilisateur a simplement vidé dans le formulaire. Résultat, un
            // 500 sur Postgres à l'enregistrement de la facture.
            //
            // Normalisé ici et non dans le contrôleur : toutes les écritures passent par
            // ce hook — création, modification, factures récurrentes, conversion de devis.
            $item->tax_rate = $item->tax_rate ?? 0;
            $item->discount_amount = $item->discount_amount ?? 0;

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
