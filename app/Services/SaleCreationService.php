<?php

namespace App\Services;

use App\Support\Unit;
use App\Models\Customer;
use App\Models\CustomerCredit;
use App\Models\Product;
use App\Models\Sale;
use App\Support\GlobalDiscount;
use App\Models\Shop;
use App\Support\ConcurrencySafe;
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
        // ticket_number is generated from the last known number (see Sale::generateTicketNumber);
        // two concurrent sales can compute the same candidate number. Retrying regenerates a
        // fresh one on each attempt instead of losing the sale to a raw constraint violation.
        return ConcurrencySafe::retryOnDuplicate(fn () => DB::transaction(function () use ($data, $shop) {
            $items = $data['items'];
            unset($data['items']);

            // Aggregate quantities per product (an item list can reference the same
            // product more than once) and lock the rows for the duration of the
            // transaction, to prevent two concurrent sales from oversell the same stock.
            $neededByProduct = [];
            foreach ($items as $itemData) {
                $neededByProduct[$itemData['product_id']] = Unit::round(($neededByProduct[$itemData['product_id']] ?? 0) + $itemData['quantity']);
            }

            // The shop boundary lives here, not in each caller's validation: the web
            // form, the offline sync and the API all land in this method, and an
            // `exists:products,id` rule accepts any tenant's product. Without it, a sale
            // decremented another account's stock and copied its product onto the ticket.
            $products = Product::whereIn('id', array_keys($neededByProduct))
                ->where('shop_id', $shop->id)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if (!empty($data['customer_id']) && !$shop->customers()->whereKey($data['customer_id'])->exists()) {
                throw ValidationException::withMessages(['customer_id' => "Ce client n'appartient pas à cette boutique."]);
            }

            $errors = [];
            foreach ($neededByProduct as $productId => $neededQty) {
                $product = $products->get($productId);

                if (!$product) {
                    $errors['items'][] = "Le produit #{$productId} n'appartient pas à cette boutique.";
                } elseif ($product->track_stock && $product->stock_quantity < $neededQty) {
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

            // Une remise sur la vente entière réduit la base imposable. Elle était
            // retranchée du TTC, donc après la taxe, ce qui surévaluait la TVA dès qu'un
            // geste commercial était fait au comptoir.
            $discount = GlobalDiscount::effective($subtotal, $data['discount_amount'] ?? 0);
            $taxAmount = round($taxAmount * GlobalDiscount::ratio($subtotal, $discount), 2);
            $total = round($subtotal - $discount + $taxAmount, 2);

            // Ce qui paie la vente sans être de l'argent remis aujourd'hui : l'avoir d'un
            // échange et l'avoir du client. Ils comptent dans `amount_paid` (la vente est
            // réglée), et sont gardés à part pour le ticket et la caisse.
            $exchangeCredit = round((float) ($data['exchange_credit'] ?? 0), 2);
            $storeCreditUsed = round((float) ($data['store_credit_used'] ?? 0), 2);
            $customer = self::creditCustomer($data, $shop, $storeCreditUsed, (float) ($data['store_credit_kept'] ?? 0));

            if ($storeCreditUsed > 0) {
                $available = $customer->creditBalance();
                if ($storeCreditUsed > $available) {
                    throw ValidationException::withMessages(['store_credit_used' => "L'avoir de ce client n'est que de " . number_format($available, 0, ',', ' ') . '.']);
                }
                if ($storeCreditUsed > $total) {
                    throw ValidationException::withMessages(['store_credit_used' => "L'avoir utilisé dépasse le total de la vente."]);
                }
            }

            $amountPaid = round((float) $data['amount_paid'] + $exchangeCredit + $storeCreditUsed, 2);
            $remaining = max(0, $total - $amountPaid);
            $change = max(0, $amountPaid - $total);

            // Le surplus d'un échange peut être gardé en avoir plutôt que rendu : jamais plus
            // que ce surplus, et seulement au client nommé (un client de passage n'a pas de
            // compte où le retrouver).
            $kept = round((float) ($data['store_credit_kept'] ?? 0), 2);
            if ($kept > 0 && $kept > round($change, 2)) {
                throw ValidationException::withMessages(['store_credit_kept' => "On ne peut garder en avoir que ce qui reste à rendre (" . number_format($change, 0, ',', ' ') . ').']);
            }
            $change = round($change - $kept, 2);

            $data['amount_paid'] = $amountPaid;
            $data['exchange_credit'] = $exchangeCredit;
            $data['store_credit_used'] = $storeCreditUsed;
            $data['store_credit_kept'] = $kept;

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

            if ($storeCreditUsed > 0) {
                CustomerCredit::create([
                    'shop_id' => $shop->id, 'customer_id' => $customer->id, 'user_id' => $data['user_id'] ?? null,
                    'sale_id' => $sale->id, 'amount' => -$storeCreditUsed, 'type' => 'used',
                    'notes' => "Utilisé sur la vente {$sale->ticket_number}",
                ]);
            }

            if ($kept > 0) {
                CustomerCredit::create([
                    'shop_id' => $shop->id, 'customer_id' => $customer->id, 'user_id' => $data['user_id'] ?? null,
                    'sale_id' => $sale->id, 'amount' => $kept, 'type' => 'exchange_kept',
                    'notes' => "Reste de l'échange, vente {$sale->ticket_number}",
                ]);
            }

            return $sale;
        }));
    }

    /**
     * Le client dont l'avoir est utilisé ou alimenté, verrouillé : deux ventes simultanées
     * ne doivent pas dépenser deux fois le même avoir.
     */
    private static function creditCustomer(array $data, Shop $shop, float $used, float $kept): ?Customer
    {
        if ($used <= 0 && $kept <= 0) {
            return null;
        }

        $customer = empty($data['customer_id'])
            ? null
            : $shop->customers()->whereKey($data['customer_id'])->lockForUpdate()->first();

        if (!$customer) {
            throw ValidationException::withMessages([
                ($used > 0 ? 'store_credit_used' : 'store_credit_kept') => "Choisissez un client enregistré : un avoir s'attache à un client.",
            ]);
        }

        return $customer;
    }
}
