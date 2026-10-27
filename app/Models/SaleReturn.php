<?php

namespace App\Models;

use App\Support\Unit;
use App\Casts\Quantity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class SaleReturn extends Model
{
    use HasFactory;

    protected $table = 'returns';

    /**
     * Même cloisonnement que BelongsToShop, mais par la vente : la table `returns` n'a
     * pas de shop_id. Avec le trait, la liaison filtrait sur returns.shop_id, une colonne
     * inexistante, et annuler un retour levait une erreur SQL à chaque fois.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $query = $this->resolveRouteBindingQuery($this, $value, $field);
        $user = Auth::user();

        if ($user && $user->role !== 'admin_platforme') {
            $query->whereHas('sale', fn ($sale) => $sale->whereIn('shop_id', $user->accessibleShopsQuery()->select('shops.id')));
        }

        return $query->first();
    }

    protected $fillable = [
        'sale_id',
        'sale_item_id',
        'user_id',
        'quantity_returned',
        'refund_amount',
        'refund_method',
        'reason',
        'notes',
        'return_date',
    ];

    protected $casts = [
        'quantity_returned' => Quantity::class,
        'refund_amount' => 'decimal:2',
        'return_date' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($return) {
            if (!$return->return_date) {
                $return->return_date = now();
            }
        });
        
        static::created(function ($return) {
            // Marquer l'article comme retourné si toute la quantité est retournée
            $saleItem = $return->saleItem;
            $totalReturned = Unit::round($saleItem->returns->sum('quantity_returned'));

            if ($totalReturned >= $saleItem->quantity) {
                $saleItem->update(['is_returned' => true]);
            }

            // Créer une entrée dans returned_inventories au lieu de modifier le stock immédiatement
            if ($saleItem->product) {
                \App\Models\ReturnedInventory::create([
                    'sale_return_id' => $return->id,
                    'product_id' => $saleItem->product_id,
                    'shop_id' => $return->sale->shop_id,
                    'quantity' => $return->quantity_returned,
                    'reason' => $return->reason,
                    'condition' => $return->reason === 'defective' ? 'defective' : 'good',
                    'status' => 'pending',
                    'notes' => $return->notes,
                ]);
            }

            // Vérifier si toute la vente est retournée
            $sale = $return->sale;
            $allItemsReturned = $sale->items->every(function ($item) {
                return $item->is_returned;
            });

            if ($allItemsReturned) {
                $sale->update(['status' => 'returned']);
            }
        });
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
