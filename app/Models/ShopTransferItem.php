<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_transfer_id',
        'product_id',
        'target_product_id',
        'product_name',
    ];

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(ShopTransfer::class, 'shop_transfer_id');
    }

    /** Le produit d'origine. Null s'il a été supprimé depuis — le nom reste sur la ligne. */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function targetProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'target_product_id');
    }
}
