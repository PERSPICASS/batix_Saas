<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Chercher les prix d'achat de boutique qu'un transfert de dépôt a pu écraser.
 *
 * Jusqu'au correctif 3b3789d, un transfert dépôt → boutique réécrivait sans condition le
 * `purchase_price` du produit de la boutique avec celui de la ligne de dépôt. Un dépôt
 * appartenant au compte et pouvant alimenter plusieurs boutiques, un même prix a pu s'imposer
 * à des produits de boutiques différentes.
 *
 * L'ancienne valeur n'est enregistrée nulle part : ce chemin n'appelait pas ActivityLogger.
 * Aucune preuve directe n'existe donc, et cette commande ne peut produire qu'un faisceau
 * d'indices — des produits À VÉRIFIER, jamais un verdict :
 *
 *   1. le produit a bien reçu un transfert depuis un dépôt ;
 *   2. son prix d'achat actuel est exactement celui de la ligne de dépôt d'origine.
 *
 * L'égalité est un indice, pas une preuve : une boutique peut légitimement porter le même prix
 * que son dépôt. La commande classe donc par impact réel plutôt que par certitude.
 */
class AuditDepotPriceOverwrites extends Command
{
    protected $signature = 'depots:audit-prices {--all : Lister aussi les cas sans impact sur la valorisation}';

    protected $description = "Repérer les prix d'achat de boutique qu'un transfert de dépôt a pu écraser (lecture seule).";

    public function handle(): int
    {
        $suspects = DB::table('depot_transfers as dt')
            ->join('products as p', 'p.id', '=', 'dt.product_id')
            ->join('depot_products as dp', function ($join) {
                $join->on('dp.product_id', '=', 'dt.product_id')
                    ->on('dp.depot_id', '=', 'dt.depot_id');
            })
            ->join('shops as s', 's.id', '=', 'p.shop_id')
            ->whereColumn('p.purchase_price', 'dp.purchase_price')
            ->where('dp.purchase_price', '>', 0)
            ->distinct()
            ->get([
                'p.id', 'p.name', 'p.sku', 'p.purchase_price', 'p.average_cost',
                'p.stock_quantity', 's.name as shop_name',
            ]);

        if ($suspects->isEmpty()) {
            $this->info('Aucun prix de boutique ne coïncide avec celui du dépôt qui l’a alimenté : rien à vérifier.');

            return self::SUCCESS;
        }

        // Un écrasement ne fausse la valorisation que si `purchase_price` en est réellement la
        // base — c'est-à-dire tant qu'aucune moyenne pondérée n'a pris le relais
        // (Product::unitCost()). Et il ne coûte quelque chose que s'il reste du stock.
        [$costly, $harmless] = $suspects->partition(
            fn ($row) => $row->average_cost === null && (int) $row->stock_quantity > 0
        );

        if ($costly->isNotEmpty()) {
            $this->newLine();
            $this->warn($costly->count() . ' produit(s) à vérifier — leur prix d’achat sert de base à la valorisation :');
            $this->table(
                ['Boutique', 'Produit', 'SKU', "Prix d'achat", 'Stock', 'Valeur en jeu'],
                $costly->map(fn ($row) => [
                    $row->shop_name,
                    \Illuminate\Support\Str::limit($row->name, 34),
                    $row->sku ?? '—',
                    $row->purchase_price,
                    $row->stock_quantity,
                    number_format((float) $row->purchase_price * (int) $row->stock_quantity, 2, ',', ' '),
                ])
            );
        }

        if ($harmless->isNotEmpty()) {
            $this->newLine();
            $this->line($harmless->count() . ' autre(s) cas sans effet sur la valorisation : une moyenne pondérée '
                . 'a pris le relais, ou il ne reste aucun stock.');

            if ($this->option('all')) {
                $this->table(
                    ['Boutique', 'Produit', "Prix d'achat", 'Moyenne', 'Stock'],
                    $harmless->map(fn ($row) => [
                        $row->shop_name,
                        \Illuminate\Support\Str::limit($row->name, 34),
                        $row->purchase_price,
                        $row->average_cost ?? '—',
                        $row->stock_quantity,
                    ])
                );
            }
        }

        $this->newLine();
        $this->line('Ce sont des COÏNCIDENCES, pas des écrasements prouvés : l’ancien prix n’est');
        $this->line('enregistré nulle part. Une boutique peut légitimement porter le prix de son dépôt.');
        $this->line('Le correctif 3b3789d empêche que cela se reproduise ; rien n’est réécrit ici.');

        return self::SUCCESS;
    }
}
