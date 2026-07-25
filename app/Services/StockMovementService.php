<?php

namespace App\Services;

use App\Models\Depot;
use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class StockMovementService
{
    /**
     * Decrease stock when a sale item is created (POS sale).
     *
     * @param Product      $product
     * @param int          $quantity   Positive number of units sold
     * @param int          $shopId
     * @param Model|null   $reference  The Sale model (for polymorphic reference)
     * @param string|null  $notes
     */
    public static function recordSale(
        Product $product,
        int $quantity,
        int $shopId,
        ?Model $reference = null,
        ?string $notes = null
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        $product->decrement('stock_quantity', $quantity);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'sale',
            'quantity'       => -$quantity,
            'reference_id'   => $reference?->getKey(),
            'reference_type' => $reference ? class_basename($reference) : null,
            'notes'          => $notes ?? 'Vente enregistrée',
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Adjust stock when a sale item quantity is edited (delta correction).
     *
     * @param Product  $product
     * @param int      $oldQuantity  The original quantity before edit
     * @param int      $newQuantity  The new quantity after edit
     * @param int      $shopId
     * @param Model    $reference    The Sale model
     */
    public static function recordSaleItemEdit(
        Product $product,
        int $oldQuantity,
        int $newQuantity,
        int $shopId,
        Model $reference
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        $delta = $newQuantity - $oldQuantity;

        if ($delta === 0) {
            return null;
        }

        if ($delta > 0) {
            $product->decrement('stock_quantity', $delta);
        } else {
            $product->increment('stock_quantity', abs($delta));
        }

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'adjustment',
            'quantity'       => -$delta,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => "Correction quantité article vendu (ancienne: {$oldQuantity}, nouvelle: {$newQuantity})",
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Return stock to shelf when a sale is cancelled.
     *
     * @param Product      $product
     * @param int          $quantity
     * @param int          $shopId
     * @param Model        $reference  The Sale model
     */
    public static function recordSaleCancellation(
        Product $product,
        int $quantity,
        int $shopId,
        Model $reference
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        $product->increment('stock_quantity', $quantity);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'return',
            'quantity'       => $quantity,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => "Annulation vente {$reference->ticket_number}",
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Re-deduct stock when a cancelled sale is restored.
     *
     * @param Product  $product
     * @param int      $quantity
     * @param int      $shopId
     * @param Model    $reference  The Sale model
     */
    public static function recordSaleRestore(
        Product $product,
        int $quantity,
        int $shopId,
        Model $reference
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        $product->decrement('stock_quantity', $quantity);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'sale',
            'quantity'       => -$quantity,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => "Réactivation vente {$reference->ticket_number}",
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Restore stock when a sale return is cancelled.
     */
    public static function recordReturnCancellation(
        Product $product,
        int $quantity,
        int $shopId,
        Model $reference
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        $product->decrement('stock_quantity', $quantity);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'sale',
            'quantity'       => -$quantity,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => 'Annulation du retour (re-déduction stock)',
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Add good-condition returned item to stock_quantity.
     * Add defective-condition returned item to defective_stock_quantity.
     *
     * @param Product  $product
     * @param int      $quantity
     * @param string   $condition  'good' or 'defective'
     * @param int      $shopId
     * @param Model    $reference  The ReturnedInventory model
     */
    public static function recordReturnedInventoryApproval(
        Product $product,
        int $quantity,
        string $condition,
        int $shopId,
        Model $reference
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        if ($condition === 'good') {
            $product->increment('stock_quantity', $quantity);
            $type = 'return';
            $notes = 'Article retourné approuvé (bon état)';
        } else {
            $product->increment('defective_stock_quantity', $quantity);
            $type = 'return_defective';
            $notes = 'Article retourné approuvé (défectueux)';
        }

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => $type,
            'quantity'       => $quantity,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => $notes,
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Add stock when a purchase order is received.
     *
     * @param Product       $product
     * @param int           $quantity
     * @param float|null    $unitCost
     * @param int           $shopId
     * @param Model         $reference  The Purchase model
     * @param string|null   $notes
     */
    public static function recordPurchaseReceipt(
        Product $product,
        int $quantity,
        ?float $unitCost,
        int $shopId,
        Model $reference,
        ?string $notes = null
    ): StockMovement {
        // La moyenne se calcule AVANT l'incrément : elle pondère le stock détenu contre
        // celui qui entre. Après coup, le stock détenu inclurait déjà l'entrée.
        $product->foldIntoAverageCost($quantity, $unitCost);

        $product->increment('stock_quantity', $quantity);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'in',
            'quantity'       => $quantity,
            'unit_cost'      => $unitCost,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => $notes ?? "Réception bon de commande {$reference->reference}",
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Add stock from depot transfer to shop product.
     *
     * @param Product  $product
     * @param int      $quantity
     * @param int      $shopId
     * @param Model    $reference  The DepotTransfer model
     */
    public static function recordDepotTransfer(
        Product $product,
        int $quantity,
        int $shopId,
        Model $reference
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        $product->increment('stock_quantity', $quantity);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'transfer',
            'quantity'       => $quantity,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => 'Transfert depuis dépôt',
            'movement_date'  => now()->toDateString(),
        ]);
    }



    /**
     * Sortie de stock à l'émission d'une facture.
     *
     * Symétrique de recordSale : c'est le même événement, de la marchandise qui quitte la
     * boutique, par un autre document.
     */
    public static function recordInvoiceIssue(
        Product $product,
        int $quantity,
        int $shopId,
        Model $reference
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        $product->decrement('stock_quantity', $quantity);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'sale',
            'quantity'       => -$quantity,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => 'Facture émise',
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Retour en stock à l'annulation d'une facture qui l'avait sorti.
     */
    public static function recordInvoiceCancellation(
        Product $product,
        int $quantity,
        int $shopId,
        Model $reference
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        $product->increment('stock_quantity', $quantity);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'return',
            'quantity'       => $quantity,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => 'Facture annulée',
            'movement_date'  => now()->toDateString(),
        ]);
    }


    /**
     * Un côté d'un transfert entre boutiques.
     *
     * Un produit appartient à UNE boutique : transférer ne déplace donc pas une ligne,
     * cela sort du stock d'un côté et en fait entrer de l'autre, sur deux produits
     * distincts. D'où deux mouvements, chacun rattaché à sa boutique, la boutique d'en
     * face servant de référence pour pouvoir les rapprocher.
     *
     * @param int $signedQuantity Négatif pour la boutique qui envoie, positif pour celle
     *                            qui reçoit.
     */
    public static function recordShopTransfer(
        Product $product,
        int $signedQuantity,
        Shop $counterpart,
        ?Model $reference = null,
        ?string $notes = null
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        if ($signedQuantity < 0) {
            $product->decrement('stock_quantity', abs($signedQuantity));
        } else {
            $product->increment('stock_quantity', $signedQuantity);
        }

        return self::writeMovement([
            'shop_id'        => $product->shop_id,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'transfer',
            'quantity'       => $signedQuantity,
            // Le document de transfert sert de référence quand il existe : c'est lui qui
            // rapproche les deux côtés. Sinon, la boutique d'en face.
            'reference_id'   => $reference?->getKey() ?? $counterpart->id,
            'reference_type' => $reference ? class_basename($reference) : 'Shop',
            'notes'          => $notes,
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Un mouvement de stock survenu dans un dépôt.
     *
     * Les quantités de dépôt vivent dans `depot_products`, pas dans
     * `products.stock_quantity` : cette méthode n'incrémente donc AUCUN compteur, elle ne
     * fait qu'enregistrer. L'appelant reste responsable du `increment`/`decrement` sur la
     * ligne `depot_products`, comme il le faisait déjà — ce qui manquait, c'était la trace.
     *
     * @param int $signedQuantity  Positif pour une entrée, négatif pour une sortie.
     */
    public static function recordDepotMovement(
        Product $product,
        Depot $depot,
        int $signedQuantity,
        string $type,
        ?Model $reference = null,
        ?string $notes = null
    ): ?StockMovement {
        if (!$product->track_stock) {
            return null;
        }

        return self::writeMovement([
            // La boutique vient du produit, pas du dépôt : un dépôt appartient au COMPTE
            // (`depots.code_user`) et peut alimenter plusieurs boutiques, alors qu'un
            // produit n'appartient qu'à une seule.
            'shop_id'        => $product->shop_id,
            'product_id'     => $product->id,
            'depot_id'       => $depot->id,
            'user_id'        => Auth::id(),
            'type'           => $type,
            'quantity'       => $signedQuantity,
            'reference_id'   => $reference?->getKey(),
            'reference_type' => $reference ? class_basename($reference) : null,
            'notes'          => $notes,
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Saisie directe d'une quantité de dépôt.
     *
     * L'écran d'édition remplace la quantité au lieu de la corriger d'un delta, si bien
     * qu'un écart y disparaissait sans laisser de trace. On enregistre donc la différence,
     * qui est l'information utile — et rien si la quantité n'a pas bougé.
     */
    public static function recordDepotCount(
        Product $product,
        Depot $depot,
        int $previousQuantity,
        int $countedQuantity,
        ?string $notes = null
    ): ?StockMovement {
        $delta = $countedQuantity - $previousQuantity;

        if ($delta === 0) {
            return null;
        }

        return self::recordDepotMovement(
            $product,
            $depot,
            $delta,
            'adjustment',
            null,
            $notes ?? "Quantité corrigée en dépôt : {$previousQuantity} → {$countedQuantity}"
        );
    }

    /**
     * Manual adjustment (from StockMovementController form submission).
     *
     * @param Product      $product
     * @param int          $quantity   Can be positive (in) or negative (out)
     * @param string       $type       One of: in, out, transfer, adjustment
     * @param int          $shopId
     * @param string|null  $notes
     * @param string|null  $movementDate
     * @param float|null   $unitCost
     */
    public static function recordManualAdjustment(
        Product $product,
        int $quantity,
        string $type,
        int $shopId,
        ?string $notes = null,
        ?string $movementDate = null,
        ?float $unitCost = null
    ): StockMovement {
        $isIn = in_array($type, ['in', 'return', 'adjustment']) && $quantity > 0;
        $isOut = in_array($type, ['out', 'sale']) || $quantity < 0;

        if ($isIn) {
            $product->increment('stock_quantity', abs($quantity));
        } elseif ($isOut) {
            $product->decrement('stock_quantity', abs($quantity));
        }

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => $type,
            'quantity'       => $quantity,
            'unit_cost'      => $unitCost,
            'notes'          => $notes,
            'movement_date'  => $movementDate ?? now()->toDateString(),
        ]);
    }

    /**
     * Hard-set stock_quantity to a counted value (inventory completion).
     *
     * @param Product       $product
     * @param int           $countedQty
     * @param int           $shopId
     * @param Model         $reference   The Inventory model
     * @param float|null    $unitCost
     */
    public static function recordInventoryAdjustment(
        Product $product,
        int $countedQty,
        int $shopId,
        Model $reference,
        ?float $unitCost = null
    ): ?StockMovement {
        $difference = $countedQty - $product->stock_quantity;

        if ($difference === 0) {
            return null;
        }

        $product->update(['stock_quantity' => $countedQty]);

        return self::writeMovement([
            'shop_id'        => $shopId,
            'product_id'     => $product->id,
            'user_id'        => Auth::id(),
            'type'           => 'adjustment',
            'quantity'       => $difference,
            'unit_cost'      => $unitCost,
            'reference_id'   => $reference->getKey(),
            'reference_type' => class_basename($reference),
            'notes'          => "Ajustement inventaire {$reference->inventory_number} (attendu: " . ($countedQty - $difference) . ", compté: {$countedQty})",
            'movement_date'  => $reference->inventory_date->toDateString(),
        ]);
    }

    /**
     * Adjust both stock_quantity and defective_stock_quantity from inventory count.
     *
     * @param Product       $product
     * @param int           $countedGoodQty      Good items counted
     * @param int           $countedDefectiveQty Defective items found
     * @param int           $shopId
     * @param Model         $reference           The Inventory model
     * @param float|null    $unitCost
     */
    public static function recordInventoryAdjustmentWithDefective(
        Product $product,
        int $countedGoodQty,
        int $countedDefectiveQty,
        int $shopId,
        Model $reference,
        ?float $unitCost = null
    ): void {
        $goodDifference = $countedGoodQty - $product->stock_quantity;
        $defectiveDifference = $countedDefectiveQty - $product->defective_stock_quantity;

        // Adjust good stock
        if ($goodDifference !== 0) {
            $product->update(['stock_quantity' => $countedGoodQty]);
            self::writeMovement([
                'shop_id'        => $shopId,
                'product_id'     => $product->id,
                'user_id'        => Auth::id(),
                'type'           => 'adjustment',
                'quantity'       => $goodDifference,
                'unit_cost'      => $unitCost,
                'reference_id'   => $reference->getKey(),
                'reference_type' => class_basename($reference),
                'notes'          => "Inventaire {$reference->inventory_number} - Articles bons (attendu: " . ($countedGoodQty - $goodDifference) . ", compté: {$countedGoodQty})",
                'movement_date'  => $reference->inventory_date->toDateString(),
            ]);
        }

        // Adjust defective stock
        if ($countedDefectiveQty > 0 || $defectiveDifference !== 0) {
            $product->update(['defective_stock_quantity' => $countedDefectiveQty]);
            self::writeMovement([
                'shop_id'        => $shopId,
                'product_id'     => $product->id,
                'user_id'        => Auth::id(),
                'type'           => 'return_defective',
                'quantity'       => $defectiveDifference,
                'unit_cost'      => $unitCost,
                'reference_id'   => $reference->getKey(),
                'reference_type' => class_basename($reference),
                'notes'          => "Inventaire {$reference->inventory_number} - Pièces défectueuses (attendu: " . ($countedDefectiveQty - $defectiveDifference) . ", trouvé: {$countedDefectiveQty})",
                'movement_date'  => $reference->inventory_date->toDateString(),
            ]);
        }
    }

    /**
     * Reverse a previously written StockMovement.
     */
    public static function reverseMovement(StockMovement $movement): StockMovement
    {
        $product = $movement->product;

        if ($movement->quantity > 0) {
            $product->decrement('stock_quantity', $movement->quantity);
            $reversalQty = -$movement->quantity;
        } else {
            $product->increment('stock_quantity', abs($movement->quantity));
            $reversalQty = abs($movement->quantity);
        }

        return self::writeMovement([
            'shop_id'        => $movement->shop_id,
            'product_id'     => $movement->product_id,
            'user_id'        => Auth::id(),
            'type'           => 'adjustment',
            'quantity'       => $reversalQty,
            'reference_id'   => $movement->id,
            'reference_type' => 'StockMovement',
            'notes'          => "Annulation du mouvement #{$movement->id}",
            'movement_date'  => now()->toDateString(),
        ]);
    }

    /**
     * Internal: write the StockMovement record.
     */
    private static function writeMovement(array $data): StockMovement
    {
        return StockMovement::create($data);
    }
}
