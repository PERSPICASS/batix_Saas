<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToShop;

class StockMovement extends Model
{
    use BelongsToShop;

    protected $fillable = [
        'shop_id',
        'product_id',
        'depot_id',
        'user_id',
        'type',
        'quantity',
        'unit_cost',
        'reference_id',
        'reference_type',
        'notes',
        'reason',
        'movement_date',
    ];

    /**
     * Motifs d'une saisie manuelle, par type. Les libellés sont côté front
     * (i18n/stocks.ts → reasons).
     */
    public const REASONS = [
        'in' => ['opening_stock', 'found', 'gift', 'other'],
        'out' => ['breakage', 'loss', 'theft', 'internal_use', 'expired', 'other'],
    ];

    protected $appends = ['is_manual'];

    protected $casts = [
        'movement_date' => 'date',
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    /**
     * Saisi depuis le formulaire « Nouveau mouvement » : une entrée ou une sortie qui ne
     * vient ni d'un document (vente, facture, achat…) ni d'un dépôt. C'est le seul genre
     * de mouvement qu'on peut supprimer : annuler la ligne d'une vente remettait les
     * articles en stock alors que la vente existait toujours, et annuler un mouvement de
     * dépôt modifiait le stock du comptoir.
     */
    public function getIsManualAttribute(): bool
    {
        return in_array($this->type, ['in', 'out'], true)
            && $this->reference_type === null
            && $this->depot_id === null;
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Le dépôt concerné, ou null pour le stock du comptoir.
     */
    public function depot(): BelongsTo
    {
        return $this->belongsTo(Depot::class);
    }

    /** Mouvements du comptoir, ceux que reflète products.stock_quantity. */
    public function scopeAtCounter($query)
    {
        return $query->whereNull('depot_id');
    }

    public function scopeInDepot($query, int $depotId)
    {
        return $query->where('depot_id', $depotId);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
