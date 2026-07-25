<?php

namespace App\Console\Commands;

use App\Models\DepotProduct;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Confronte les compteurs de stock au registre des mouvements.
 *
 * `products.stock_quantity` et `depot_products.quantity` sont des compteurs : ils disent
 * l'état, pas comment on y est arrivé. `stock_movements` dit le contraire. Rien ne
 * vérifiait que les deux racontent la même histoire, donc une dérive était indétectable —
 * on ne pouvait ni la constater, ni la dater, ni en trouver la cause.
 *
 * La commande ne corrige JAMAIS un compteur. Le stock réel est ce qu'il y a sur les
 * étagères, pas ce qu'un calcul déduit : réécrire une quantité depuis le registre
 * remplacerait un chiffre douteux par un chiffre faux. Elle signale, et `--baseline`
 * permet d'inscrire l'écart au registre pour repartir sur une base saine.
 */
class AuditStock extends Command
{
    protected $signature = 'stock:audit
        {--shop= : Limiter à une boutique}
        {--baseline : Inscrire l\'écart au registre pour repartir d\'une base cohérente}';

    protected $description = "Compare les compteurs de stock à la somme des mouvements et signale les écarts.";

    public function handle(): int
    {
        $shopId = $this->option('shop');

        $rows = array_merge(
            $this->auditCounters($shopId),
            $this->auditDepots($shopId),
        );

        if (empty($rows)) {
            $this->info('Aucun écart : chaque compteur correspond à la somme de ses mouvements.');

            return self::SUCCESS;
        }

        $this->table(
            ['Boutique', 'Produit', 'Emplacement', 'Compteur', 'Registre', 'Écart'],
            array_map(fn ($r) => [
                $r['shop_id'],
                $r['product'],
                $r['location'],
                $r['counter'],
                $r['ledger'],
                sprintf('%+d', $r['drift']),
            ], $rows)
        );

        $this->newLine();

        if (!$this->option('baseline')) {
            $this->warn(count($rows) . ' écart(s). Le stock réel n\'a PAS été modifié.');
            $this->line('Relancer avec --baseline pour inscrire ces écarts au registre,');
            $this->line('afin que toute dérive ultérieure soit détectable.');

            return self::SUCCESS;
        }

        $this->writeBaseline($rows);
        $this->info(count($rows) . ' écart(s) inscrit(s) au registre. Les compteurs sont inchangés.');

        return self::SUCCESS;
    }

    /**
     * Le stock du comptoir : products.stock_quantity contre les mouvements sans dépôt.
     *
     * @return array<int, array<string, mixed>>
     */
    private function auditCounters(?string $shopId): array
    {
        $ledger = StockMovement::query()
            ->atCounter()
            ->when($shopId, fn ($q) => $q->where('shop_id', $shopId))
            ->groupBy('product_id')
            ->select('product_id', DB::raw('SUM(quantity) as total'))
            ->pluck('total', 'product_id');

        $rows = [];

        Product::query()
            ->where('track_stock', true)
            ->when($shopId, fn ($q) => $q->where('shop_id', $shopId))
            ->select('id', 'shop_id', 'name', 'stock_quantity')
            ->chunkById(500, function ($products) use ($ledger, &$rows) {
                foreach ($products as $product) {
                    $counter = (int) $product->stock_quantity;
                    $sum = (int) ($ledger[$product->id] ?? 0);

                    if ($counter !== $sum) {
                        $rows[] = [
                            'shop_id' => $product->shop_id,
                            'product_id' => $product->id,
                            'depot_id' => null,
                            'product' => $product->name,
                            'location' => 'Comptoir',
                            'counter' => $counter,
                            'ledger' => $sum,
                            'drift' => $counter - $sum,
                        ];
                    }
                }
            });

        return $rows;
    }

    /**
     * Chaque dépôt : depot_products.quantity contre les mouvements de ce dépôt.
     *
     * @return array<int, array<string, mixed>>
     */
    private function auditDepots(?string $shopId): array
    {
        $ledger = StockMovement::query()
            ->whereNotNull('depot_id')
            ->when($shopId, fn ($q) => $q->where('shop_id', $shopId))
            ->groupBy('depot_id', 'product_id')
            ->select('depot_id', 'product_id', DB::raw('SUM(quantity) as total'))
            ->get()
            ->keyBy(fn ($r) => "{$r->depot_id}:{$r->product_id}");

        $rows = [];

        DepotProduct::query()
            ->with(['depot:id,name,shop_id', 'product:id,name,track_stock'])
            ->when($shopId, fn ($q) => $q->whereHas('depot', fn ($d) => $d->where('shop_id', $shopId)))
            ->chunkById(500, function ($depotProducts) use ($ledger, &$rows) {
                foreach ($depotProducts as $dp) {
                    if (!$dp->product || !$dp->product->track_stock || !$dp->depot) {
                        continue;
                    }

                    $counter = (int) $dp->quantity;
                    $sum = (int) ($ledger["{$dp->depot_id}:{$dp->product_id}"]->total ?? 0);

                    if ($counter !== $sum) {
                        $rows[] = [
                            'shop_id' => $dp->depot->shop_id,
                            'product_id' => $dp->product_id,
                            'depot_id' => $dp->depot_id,
                            'product' => $dp->product->name,
                            'location' => $dp->depot->name,
                            'counter' => $counter,
                            'ledger' => $sum,
                            'drift' => $counter - $sum,
                        ];
                    }
                }
            });

        return $rows;
    }

    /**
     * Inscrit chaque écart comme un ajustement daté.
     *
     * Sans cela, un premier audit signale surtout l'historique : les inventaires posent une
     * quantité absolue et les mouvements de dépôt n'existaient pas avant aujourd'hui, donc
     * la somme ne pouvait pas coïncider. Une fois la base posée, tout nouvel écart désigne
     * un vrai problème.
     *
     * @param array<int, array<string, mixed>> $rows
     */
    private function writeBaseline(array $rows): void
    {
        foreach ($rows as $row) {
            StockMovement::create([
                'shop_id' => $row['shop_id'],
                'product_id' => $row['product_id'],
                'depot_id' => $row['depot_id'],
                // Pas d'utilisateur : c'est la commande qui écrit, pas quelqu'un.
                'user_id' => null,
                'type' => 'adjustment',
                'quantity' => $row['drift'],
                'notes' => 'Reprise : mise en cohérence du registre avec le compteur (stock:audit --baseline)',
                'movement_date' => now()->toDateString(),
            ]);
        }
    }
}
