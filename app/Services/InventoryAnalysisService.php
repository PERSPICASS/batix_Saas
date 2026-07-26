<?php

namespace App\Services;

use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use Illuminate\Support\Collection;

class InventoryAnalysisService
{
    /**
     * Ce que le module doit savoir de chaque produit avant qu'on le compte.
     *
     * Le « stock théorique » y est reconstruit, et non affirmé :
     *
     *     théorique = dernier comptage + reçu depuis − vendu depuis
     *
     * L'intérêt n'est pas d'obtenir un autre nombre que `products.stock_quantity` — les deux
     * doivent coïncider — mais précisément de pouvoir les comparer. Quand ils diffèrent, le
     * compteur et l'historique se contredisent, et c'est ce que `stock:audit` détecte le lundi ;
     * autant le dire à la personne qui tient le produit dans les mains. Le nombre cesse aussi
     * d'être une assertion : « 100 au dernier inventaire, +30 reçus, −12 vendus » s'explique.
     *
     * La borne est prise PAR PRODUIT, à son dernier comptage effectif, et non au dernier
     * inventaire de la boutique. C'est indispensable depuis qu'un inventaire partiel est un cas
     * normal : compter l'allée A ne doit pas remettre à zéro la fenêtre de l'allée B.
     *
     * `$shopId` est nullable, et doit l'être : get_active_shop_id() renvoie null pour un compte
     * sans boutique — un `int` strict faisait échouer la page « Nouvel inventaire » sur une
     * TypeError, donc une 500 au lieu d'une liste vide.
     *
     * @param \Illuminate\Database\Eloquent\Collection $products
     * @param int|null $shopId
     * @return array
     */
    public static function enrichProductsWithMovements($products, ?int $shopId): array
    {
        $productIds = $products->pluck('id');

        if (!$shopId || $productIds->isEmpty()) {
            return $products->map(fn (Product $product) => self::shape($product, null, 0, 0))->toArray();
        }

        $lastCounts = self::lastCountByProduct($shopId, $productIds);

        // Les produits sont regroupés par borne : en pratique ils ont été comptés lors du même
        // inventaire, donc ce regroupement tient en une ou deux valeurs, et donc en une ou deux
        // requêtes — plutôt qu'une par produit.
        // Tableaux et non Collections : `merge()` renumérote les clés entières, ce qui perdrait
        // les identifiants de produit sur lesquels tout repose ici.
        $sold = [];
        $purchased = [];

        foreach ($productIds->groupBy(fn ($id) => $lastCounts[$id]['at'] ?? '') as $since => $ids) {
            $since = $since ?: null;

            foreach (self::soldSince($shopId, $ids, $since) as $productId => $total) {
                $sold[$productId] = $total;
            }

            foreach (self::purchasedSince($shopId, $ids, $since) as $productId => $total) {
                $purchased[$productId] = $total;
            }
        }

        return $products->map(fn (Product $product) => self::shape(
            $product,
            $lastCounts[$product->id] ?? null,
            (int) ($sold[$product->id] ?? 0),
            (int) ($purchased[$product->id] ?? 0),
        ))->toArray();
    }

    /**
     * Le dernier comptage retenu pour chaque produit : sa quantité et sa date.
     *
     * Seuls comptent les inventaires appliqués (`completed_at` non nul) et les lignes
     * réellement comptées (`counted_quantity` non nul) — une ligne laissée vide ne dit rien.
     *
     * @return \Illuminate\Support\Collection<int, array{quantity: int, at: string}>
     */
    private static function lastCountByProduct(int $shopId, Collection $productIds): Collection
    {
        return InventoryItem::query()
            ->join('inventories', 'inventories.id', '=', 'inventory_items.inventory_id')
            ->where('inventories.shop_id', $shopId)
            ->whereNotNull('inventories.completed_at')
            ->whereNotNull('inventory_items.counted_quantity')
            ->whereIn('inventory_items.product_id', $productIds)
            ->orderBy('inventories.completed_at')
            ->get([
                'inventory_items.product_id',
                'inventory_items.counted_quantity',
                'inventories.completed_at',
            ])
            // Tri croissant puis keyBy : la dernière ligne écrase les précédentes, donc le plus
            // récent comptage gagne.
            ->keyBy('product_id')
            ->map(fn ($row) => [
                'quantity' => (int) $row->counted_quantity,
                'at' => (string) $row->completed_at,
            ]);
    }

    private static function soldSince(int $shopId, Collection $productIds, ?string $since): Collection
    {
        return SaleItem::whereHas('sale', fn ($query) => $query->where('shop_id', $shopId))
            ->whereIn('product_id', $productIds)
            ->when($since, fn ($query) => $query->where('created_at', '>', $since))
            ->selectRaw('product_id, SUM(quantity) as total')
            ->groupBy('product_id')
            ->pluck('total', 'product_id');
    }

    /**
     * `received_date` appartient à `purchases`, pas à `purchase_items` : la condition de date
     * doit vivre DANS le whereHas. Placée au niveau extérieur, elle produit un SQL que Postgres
     * rejette (« column received_date does not exist ») et que SQLite accepte en la résolvant
     * contre la table du sous-EXISTS — d'où une suite de tests aveugle à cette faute.
     */
    private static function purchasedSince(int $shopId, Collection $productIds, ?string $since): Collection
    {
        return PurchaseItem::whereHas('purchase', function ($query) use ($shopId, $since) {
            $query->where('shop_id', $shopId)
                ->whereNotNull('received_date')
                ->when($since, fn ($q) => $q->where('received_date', '>', $since));
        })
            ->whereIn('product_id', $productIds)
            ->selectRaw('product_id, SUM(quantity_received) as total')
            ->groupBy('product_id')
            ->pluck('total', 'product_id');
    }

    /**
     * @param array{quantity: int, at: string}|null $lastCount
     */
    private static function shape(Product $product, ?array $lastCount, int $sold, int $purchased): array
    {
        // Sans comptage antérieur, il n'y a pas de point de départ à reconstruire : le compteur
        // système est alors la seule référence disponible, et `last_counted_at` à null permet à
        // l'interface de le dire au lieu de laisser croire à une dérivation.
        $theoretical = $lastCount
            ? $lastCount['quantity'] + $purchased - $sold
            : $product->stock_quantity;

        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'stock_quantity' => $product->stock_quantity,
            'defective_stock_quantity' => $product->defective_stock_quantity,
            'purchase_price' => $product->purchase_price,
            'shop' => $product->shop,
            'sold_since_last_inventory' => $sold,
            'purchased_since_last_inventory' => $purchased,
            'last_counted_quantity' => $lastCount['quantity'] ?? null,
            'last_counted_at' => $lastCount['at'] ?? null,
            'theoretical_stock' => $theoretical,
            // L'écart entre l'historique et le compteur. Non nul, il signale que l'un des deux
            // ment, avant même qu'on ait compté quoi que ce soit.
            'ledger_drift' => $theoretical - $product->stock_quantity,
        ];
    }
}
