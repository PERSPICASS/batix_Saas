<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleCreationService
{
    /**
     * Create a sale and its items from already-validated data, computing totals,
     * change/remaining/credit status, and (via SaleItem's model events) the
     * resulting stock movements.
     *
     * Shared by the web sale form (SaleController::store) and the public API
     * (Api\V1\SaleController::store) so both stay in lockstep — the pricing math
     * only lives in one place.
     *
     * $data must already be validated and contain: user_id, customer_id?,
     * payment_method, amount_paid, discount_amount?, credit_due_date?, notes?,
     * items[{product_id, quantity, unit_price}].
     */
    public static function create(array $data, Shop $shop): Sale
    {
        return DB::transaction(function () use ($data, $shop) {
            $items = $data['items'];
            unset($data['items']);

            // Aggregate quantities per product (an item list can reference the same
            // product more than once) and lock the rows for the duration of the
            // transaction, to prevent two concurrent sales from oversell the same stock.
            $neededByProduct = [];
            foreach ($items as $itemData) {
                $neededByProduct[$itemData['product_id']] = ($neededByProduct[$itemData['product_id']] ?? 0) + $itemData['quantity'];
            }

            $products = Product::whereIn('id', array_keys($neededByProduct))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $errors = [];
            foreach ($neededByProduct as $productId => $neededQty) {
                $product = $products->get($productId);

                if ($product && $product->track_stock && $product->stock_quantity < $neededQty) {
                    $errors['items'][] = "Stock insuffisant pour « {$product->name} » (disponible : {$product->stock_quantity}, demandé : {$neededQty}).";
                }
            }

            if (!empty($errors)) {
                throw ValidationException::withMessages($errors);
            }

            $subtotal = 0;
            $taxAmount = 0;
            $productItems = [];

            foreach ($items as $itemData) {
                $product = $products->get($itemData['product_id']);
                $lineTotal = $itemData['unit_price'] * $itemData['quantity'];
                $lineTax = $lineTotal * ($product->tax_rate ?? 0) / 100;
                $subtotal += $lineTotal;
                $taxAmount += $lineTax;
                $productItems[] = array_merge($itemData, ['product' => $product]);
            }

            $discount = (float) ($data['discount_amount'] ?? 0);
            $total = $subtotal + $taxAmount - $discount;
            $amountPaid = (float) $data['amount_paid'];
            $remaining = max(0, $total - $amountPaid);
            $change = max(0, $amountPaid - $total);

            $data['status'] = $remaining > 0 ? 'pending' : 'completed';
            $data['subtotal'] = $subtotal;
            $data['tax_amount'] = $taxAmount;
            $data['discount_amount'] = $discount;
            $data['total'] = $total;
            $data['change_amount'] = $change;
            $data['remaining_amount'] = $remaining;

            if ($remaining <= 0) {
                $data['credit_due_date'] = null;
            }

            $sale = $shop->sales()->create($data);

            foreach ($productItems as $itemData) {
                $product = $itemData['product'];

                $parentName = null;
                if ($product->parent_id) {
                    $parent = $product->parent ?? Product::find($product->parent_id);
                    $parentName = $parent?->name;
                }

                $sale->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $parentName ? "{$parentName} › {$product->name}" : $product->name,
                    'sku' => $product->sku,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'tax_rate' => $product->tax_rate ?? 0,
                    'discount_amount' => 0,
                ]);
            }

            return $sale;
        });
    }
}
