<?php

namespace App\Models;

use App\Traits\BelongsToShop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Un mouvement d'avoir client : positif quand la boutique en accorde (reste d'un échange,
 * retour remboursé en avoir), négatif quand le client le dépense. Le solde est la somme
 * des mouvements (Customer::creditBalance), jamais un compteur stocké.
 */
class CustomerCredit extends Model
{
    use BelongsToShop;

    public const TYPES = ['exchange_kept', 'return', 'used', 'used_reversed', 'return_cancelled'];

    protected $fillable = ['shop_id', 'customer_id', 'user_id', 'sale_id', 'sale_return_id', 'amount', 'type', 'notes'];

    protected $casts = ['amount' => 'decimal:2'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
