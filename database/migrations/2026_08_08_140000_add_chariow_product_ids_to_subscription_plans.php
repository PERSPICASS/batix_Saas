<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Associe les plans à leurs produits Chariow.
 *
 * Le mappage vit en base, pas dans le code : sans cette migration il faudrait
 * lancer `chariow:link-products` à la main sur chaque environnement, et un oubli
 * en production ne se verrait pas — le bouton Mobile Money resterait simplement
 * inactif. Même approche que 2026_06_26_181215 pour les identifiants Paddle.
 *
 * Les six produits sont de type « license », le seul type Chariow qui autorise
 * un même email à racheter le même produit — donc à renouveler son abonnement.
 */
return new class extends Migration
{
    private const MAPPING = [
        'starter' => ['chariow_product_id' => 'prd_pu98lf7i', 'chariow_product_id_yearly' => 'prd_7v1r04sr'],
        'growth'  => ['chariow_product_id' => 'prd_b09r5kfe', 'chariow_product_id_yearly' => 'prd_4w1s3jcy'],
        'pro'     => ['chariow_product_id' => 'prd_9kvdcol0', 'chariow_product_id_yearly' => 'prd_xuxiwo4v'],
    ];

    public function up(): void
    {
        foreach (self::MAPPING as $slug => $ids) {
            DB::table('subscription_plans')->where('slug', $slug)->update($ids);
        }
    }

    public function down(): void
    {
        DB::table('subscription_plans')
            ->whereIn('slug', array_keys(self::MAPPING))
            ->update(['chariow_product_id' => null, 'chariow_product_id_yearly' => null]);
    }
};
