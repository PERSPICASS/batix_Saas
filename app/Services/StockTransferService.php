<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\StockTransfer;
use App\Models\User;
use App\Support\ConcurrencySafe;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Le stock qui passe d'une boutique du compte à une autre, en deux temps.
 *
 * - send()    : le stock sort de la boutique d'origine ; le transfert est « en transit ».
 * - receive() : il entre dans la boutique de destination, dont le coût moyen intègre le
 *               coût d'origine (Product::foldIntoAverageCost).
 * - cancel()  : tant qu'il est en transit, il revient à l'origine.
 *
 * Un produit absent de la destination y est créé à l'envoi, avec la règle de la copie de
 * catalogue (ProductCopier) : la même référence ne doit jamais exister deux fois.
 */
class StockTransferService
{
    public function __construct(private ProductCopier $copier) {}

    /**
     * @param  array<int, int>  $lines  quantité par id de produit de la boutique d'origine
     *
     * @throws ValidationException quand le stock ne suffit pas ou qu'une ligne est invalide
     */
    public function send(Shop $from, Shop $to, array $lines, User $user, ?string $notes = null): StockTransfer
    {
        $lines = array_filter(array_map('intval', $lines), fn ($quantity) => $quantity > 0);

        if ((int) $from->id === (int) $to->id) {
            throw ValidationException::withMessages(['to_shop_id' => 'Choisissez une autre boutique que celle d\'origine.']);
        }
        if ($lines === []) {
            throw ValidationException::withMessages(['items' => 'Indiquez au moins une quantité à transférer.']);
        }

        return ConcurrencySafe::retryOnDuplicate(fn () => DB::transaction(function () use ($from, $to, $lines, $user, $notes) {
            // Verrouiller avant de vérifier, comme la caisse : deux envois simultanés de la
            // dernière unité passeraient sinon tous deux le contrôle.
            // Catégorie et parent chargés d'un coup : ProductCopier les lit pour créer le
            // produit à destination, et une requête par ligne coûterait cher sur un gros envoi.
            $products = Product::whereIn('id', array_keys($lines))->where('shop_id', $from->id)
                ->with(['category:id,name', 'parent.category:id,name'])
                ->lockForUpdate()->get()->keyBy('id');

            $errors = [];
            foreach ($lines as $productId => $quantity) {
                $product = $products->get($productId);
                if (!$product) {
                    $errors['items'][] = 'Un produit ne fait pas partie de la boutique d\'origine.';
                } elseif (!$product->track_stock) {
                    $errors['items'][] = "« {$product->name} » n'est pas suivi en stock : rien à transférer.";
                } elseif ($product->stock_quantity < $quantity) {
                    $errors['items'][] = "Stock insuffisant pour « {$product->name} » (disponible : {$product->stock_quantity}, demandé : {$quantity}).";
                }
            }
            if ($errors !== []) {
                throw ValidationException::withMessages($errors);
            }

            $transfer = StockTransfer::create([
                'from_shop_id' => $from->id,
                'to_shop_id' => $to->id,
                'user_id' => $user->id,
                'status' => 'in_transit',
                'notes' => $notes,
                'sent_at' => now(),
            ]);

            foreach ($lines as $productId => $quantity) {
                $product = $products->get($productId);
                [$destination] = $this->copier->copyInto($to, $product);

                $transfer->items()->create([
                    'product_id' => $product->id,
                    'target_product_id' => $destination->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'unit_cost' => $product->unitCost(),
                ]);

                $product->decrement('stock_quantity', $quantity);
                $this->movement($product, $from->id, -$quantity, $transfer, "Envoi {$transfer->reference} vers « {$to->name} »");
            }

            return $transfer;
        }));
    }

    /** La marchandise est arrivée : elle entre dans le stock de la boutique de destination. */
    public function receive(StockTransfer $transfer, User $user): void
    {
        DB::transaction(function () use ($transfer, $user) {
            $transfer = StockTransfer::whereKey($transfer->id)->lockForUpdate()->firstOrFail();
            $this->assertInTransit($transfer);
            $transfer->load('items.product.category', 'items.product.parent.category', 'fromShop', 'toShop');

            foreach ($transfer->items as $item) {
                $destination = Product::whereKey($item->target_product_id)->where('shop_id', $transfer->to_shop_id)->lockForUpdate()->first();

                // Supprimé depuis l'envoi : on le recrée depuis la fiche d'origine plutôt que
                // de perdre la marchandise.
                if (!$destination && $item->product) {
                    [$destination] = $this->copier->copyInto($transfer->toShop, $item->product);
                    $item->update(['target_product_id' => $destination->id]);
                }
                if (!$destination) {
                    throw ValidationException::withMessages(['transfer' => "« {$item->product_name} » n'existe plus dans aucune des deux boutiques : réception impossible."]);
                }

                // Avant l'incrément : la moyenne pondérée se calcule sur le stock déjà détenu.
                $destination->foldIntoAverageCost($item->quantity, $item->unit_cost !== null ? (float) $item->unit_cost : null);
                $destination->increment('stock_quantity', $item->quantity);
                $this->movement($destination, $transfer->to_shop_id, $item->quantity, $transfer, "Réception {$transfer->reference} depuis « {$transfer->fromShop->name} »");
            }

            $transfer->update(['status' => 'received', 'received_at' => now(), 'received_by' => $user->id]);
        });
    }

    /** Pas encore arrivé : la marchandise revient dans le stock de la boutique d'origine. */
    public function cancel(StockTransfer $transfer, User $user): void
    {
        DB::transaction(function () use ($transfer) {
            $transfer = StockTransfer::whereKey($transfer->id)->lockForUpdate()->firstOrFail();
            $this->assertInTransit($transfer);
            $transfer->load('items');

            foreach ($transfer->items as $item) {
                $source = Product::whereKey($item->product_id)->where('shop_id', $transfer->from_shop_id)->lockForUpdate()->first();
                if (!$source) {
                    continue;
                }
                $source->foldIntoAverageCost($item->quantity, $item->unit_cost !== null ? (float) $item->unit_cost : null);
                $source->increment('stock_quantity', $item->quantity);
                $this->movement($source, $transfer->from_shop_id, $item->quantity, $transfer, "Annulation {$transfer->reference}");
            }

            $transfer->update(['status' => 'cancelled']);
        });
    }

    /**
     * Les transferts à proposer entre les boutiques du compte.
     *
     * Règle (choisie avec Fred le 2026-10-25) : une boutique est sous le seuil d'alerte d'un
     * produit, une autre en détient plus du double de son propre seuil. On propose de quoi
     * remonter la première à deux fois son seuil, sans faire descendre la seconde sous deux
     * fois le sien. Ce qui est déjà en route vers la première est déduit. Un même produit
     * est reconnu d'une boutique à l'autre par son SKU, à défaut par son nom et sa marque.
     *
     * @param  Collection<int, Shop>  $shops
     * @return array<int, array{product: string, from_shop_id: int, from_shop: string, from_product_id: int, from_stock: int, from_min: int, to_shop_id: int, to_shop: string, to_product_id: int, to_stock: int, to_min: int, quantity: int}>
     */
    public function suggestions(Collection $shops): array
    {
        $names = $shops->pluck('name', 'id');

        $products = Product::whereIn('shop_id', $shops->pluck('id'))
            ->where('track_stock', true)
            ->where('has_variations', false)
            ->whereNotNull('min_stock_alert')
            ->where('min_stock_alert', '>', 0)
            ->get(['id', 'shop_id', 'name', 'brand', 'sku', 'stock_quantity', 'min_stock_alert']);

        $inTransit = DB::table('stock_transfer_items')
            ->join('stock_transfers', 'stock_transfers.id', '=', 'stock_transfer_items.stock_transfer_id')
            ->where('stock_transfers.status', 'in_transit')
            ->whereIn('stock_transfers.to_shop_id', $shops->pluck('id'))
            ->groupBy('stock_transfer_items.target_product_id')
            ->selectRaw('stock_transfer_items.target_product_id, SUM(stock_transfer_items.quantity) AS qty')
            ->pluck('qty', 'target_product_id');

        $suggestions = [];

        $groups = $products->groupBy(fn ($p) => $p->sku ? 'sku:' . mb_strtolower(trim($p->sku)) : 'name:' . mb_strtolower(trim($p->name)) . '|' . mb_strtolower(trim((string) $p->brand)));

        foreach ($groups as $group) {
            if ($group->pluck('shop_id')->unique()->count() < 2) {
                continue;
            }

            // Ce que chaque donneur peut céder, entamé au fil des propositions.
            $spare = $group->mapWithKeys(fn ($p) => [$p->id => max(0, $p->stock_quantity - 2 * $p->min_stock_alert)])->all();

            $lows = $group->filter(fn ($p) => $p->stock_quantity <= $p->min_stock_alert)
                ->sortBy(fn ($p) => $p->stock_quantity - $p->min_stock_alert);

            foreach ($lows as $low) {
                $need = 2 * $low->min_stock_alert - $low->stock_quantity - (int) ($inTransit[$low->id] ?? 0);

                $donors = $group->filter(fn ($p) => $p->shop_id !== $low->shop_id && $spare[$p->id] > 0)
                    ->sortByDesc(fn ($p) => $spare[$p->id]);

                foreach ($donors as $donor) {
                    if ($need <= 0) {
                        break;
                    }
                    $quantity = min($need, $spare[$donor->id]);
                    $spare[$donor->id] -= $quantity;
                    $need -= $quantity;

                    $suggestions[] = [
                        'product' => $low->name,
                        'from_shop_id' => $donor->shop_id,
                        'from_shop' => $names[$donor->shop_id] ?? '',
                        'from_product_id' => $donor->id,
                        'from_stock' => (int) $donor->stock_quantity,
                        'from_min' => (int) $donor->min_stock_alert,
                        'to_shop_id' => $low->shop_id,
                        'to_shop' => $names[$low->shop_id] ?? '',
                        'to_product_id' => $low->id,
                        'to_stock' => (int) $low->stock_quantity,
                        'to_min' => (int) $low->min_stock_alert,
                        'quantity' => $quantity,
                    ];
                }
            }
        }

        return $suggestions;
    }

    private function assertInTransit(StockTransfer $transfer): void
    {
        if ($transfer->status !== 'in_transit') {
            throw ValidationException::withMessages(['transfer' => $transfer->status === 'received'
                ? 'Ce transfert a déjà été réceptionné.'
                : 'Ce transfert a été annulé.']);
        }
    }

    private function movement(Product $product, int $shopId, int $quantity, StockTransfer $transfer, string $notes): void
    {
        StockMovement::create([
            'shop_id' => $shopId,
            'product_id' => $product->id,
            'user_id' => auth()->id(),
            'type' => 'transfer',
            'quantity' => $quantity,
            'unit_cost' => null,
            'reference_id' => $transfer->id,
            'reference_type' => 'StockTransfer',
            'notes' => $notes,
            'movement_date' => now()->toDateString(),
        ]);
    }
}
