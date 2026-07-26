<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;
    protected $fillable = [
        'shop_id',
        'category_id',
        'subcategory_id',
        'name',
        'slug',
        'sku',
        'barcode',
        'description',
        'brand',
        'purchase_price',
        'average_cost',
        'selling_price',
        'tax_rate',
        'stock_quantity',
        'defective_stock_quantity',
        'min_stock_alert',
        'unit',
        'image',
        'is_active',
        'track_stock',
        'has_variations',
        'parent_id',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'average_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'stock_quantity' => 'integer',
        'defective_stock_quantity' => 'integer',
        'min_stock_alert' => 'integer',
        'is_active' => 'boolean',
        'track_stock' => 'boolean',
        'has_variations' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty('name') && empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Subcategory::class);
    }

    /**
     * Le produit parent (si c'est une variation).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'parent_id');
    }

    /**
     * Les variations de ce produit.
     */
    public function variations(): HasMany
    {
        return $this->hasMany(Product::class, 'parent_id');
    }

    /**
     * Les valeurs d'attributs de cette variation.
     */
    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(ProductAttributeValue::class, 'product_variation_attributes', 'product_id', 'attribute_value_id');
    }

    /**
     * Vérifie si ce produit est une variation.
     */
    public function isVariation(): bool
    {
        return $this->parent_id !== null;
    }

    /**
     * Vérifie si ce produit a des variations.
     */
    public function hasVariations(): bool
    {
        return $this->has_variations && $this->variations()->exists();
    }

    /**
     * Les lignes de ce produit dans les dépôts.
     *
     * `stock_quantity` ne couvre QUE le comptoir : un transfert depuis un dépôt
     * l'incrémente (voir StockMovementService::recordDepotTransfer). Le stock réellement
     * détenu est donc la somme des deux, et rien ne l'exposait.
     */
    public function depotProducts(): HasMany
    {
        return $this->hasMany(DepotProduct::class);
    }

    /** Ce que la boutique détient réellement : comptoir + dépôts. */
    public function totalStock(): int
    {
        return (int) $this->stock_quantity + $this->depotStock();
    }

    /**
     * Les unités en dépôt, depuis la somme déjà jointe si elle l'a été.
     *
     * Deux alias coexistent dans le projet : `depot_stock`, choisi par la liste des produits et
     * exposé tel quel à l'interface, et `depot_products_sum_quantity`, celui que `withSum()`
     * fabrique par défaut. Ne reconnaître que le second faisait retomber la liste des produits
     * sur une requête par ligne, alors même qu'elle avait pris soin de joindre la somme.
     *
     * Le repli par requête reste, pour un modèle chargé seul — mais il ne doit jamais être
     * atteint depuis une collection.
     */
    private function depotStock(): int
    {
        foreach (['depot_stock', 'depot_products_sum_quantity'] as $alias) {
            if ($this->getAttribute($alias) !== null) {
                return (int) $this->getAttribute($alias);
            }
        }

        return (int) $this->depotProducts()->sum('quantity');
    }

    /**
     * Le coût unitaire retenu pour valoriser une unité.
     *
     * La moyenne pondérée si elle existe, sinon le dernier prix d'achat — mieux vaut une
     * approximation connue qu'un zéro qui ferait disparaître le stock du bilan.
     */
    public function unitCost(): float
    {
        return (float) ($this->average_cost ?? $this->purchase_price ?? 0);
    }

    /**
     * Ce que vaut tout le stock détenu : comptoir ET dépôts.
     *
     * Un seul coût sert de base, celui du produit — la moyenne pondérée, à défaut le prix
     * d'achat. L'endroit où se trouve la marchandise ne change pas ce qu'elle a coûté : le même
     * tournevis vaut autant en réserve que sur l'étagère.
     *
     * Cette méthode ne couvrait que le comptoir alors que l'interface l'annonce « Valeur du
     * stock », sans réserve. Tout ce qui dormait en dépôt était donc absent du chiffre censé
     * dire où est immobilisée la trésorerie.
     *
     * Penser à charger `withSum('depotProducts', 'quantity')` avant d'appeler ceci sur une
     * collection : sans quoi totalStock() interroge la base produit par produit.
     */
    public function stockValue(): float
    {
        return round($this->totalStock() * $this->unitCost(), 2);
    }

    /**
     * Ce que vaut le seul stock du comptoir.
     *
     * Utile là où la distinction compte — ce qui est vendable immédiatement, par opposition à
     * ce qui est détenu.
     */
    public function counterStockValue(): float
    {
        return round($this->stock_quantity * $this->unitCost(), 2);
    }

    /**
     * Intègre une entrée de marchandise à la moyenne pondérée.
     *
     * new = (stock × moyenne + entrée × coût) / (stock + entrée), calculé AVANT que le
     * compteur n'ait été incrémenté — d'où la quantité passée en paramètre.
     *
     * Une entrée sans coût connu ne change pas la moyenne : l'inventer à zéro
     * effondrerait la valorisation d'un seul mouvement mal saisi.
     */
    public function foldIntoAverageCost(int $incomingQuantity, ?float $unitCost): void
    {
        if ($unitCost === null || $incomingQuantity <= 0) {
            return;
        }

        $held = max((int) $this->stock_quantity, 0);
        $current = $this->average_cost !== null ? (float) $this->average_cost : (float) ($this->purchase_price ?? $unitCost);

        $total = $held + $incomingQuantity;

        if ($total <= 0) {
            return;
        }

        $this->forceFill([
            'average_cost' => round((($held * $current) + ($incomingQuantity * $unitCost)) / $total, 2),
        ])->save();
    }

    public function isLowStock(): bool
    {
        if (!$this->track_stock || $this->min_stock_alert === null) {
            return false;
        }

        return $this->stock_quantity <= $this->min_stock_alert;
    }

    /**
     * Le taux qui s'applique réellement à ce produit.
     *
     * `tax_rate` à NULL veut dire « hérite de la boutique », pas « zéro » : lire la
     * colonne brute donnerait 0 pour un produit non configuré, alors que sa boutique peut
     * avoir un taux paramétré dans les Réglages.
     */
    public function effectiveTaxRate(): float
    {
        return (float) ($this->tax_rate ?? $this->shop?->default_tax_rate ?? 0);
    }

    public function getPriceWithTaxAttribute(): float
    {
        return $this->selling_price * (1 + $this->effectiveTaxRate() / 100);
    }

    public function getMarginAttribute(): float
    {
        return $this->selling_price - $this->purchase_price;
    }

    public function getMarginPercentageAttribute(): float
    {
        if ($this->purchase_price == 0) {
            return 0;
        }

        return (($this->selling_price - $this->purchase_price) / $this->purchase_price) * 100;
    }

    public function articles(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProductArticle::class);
    }
}
