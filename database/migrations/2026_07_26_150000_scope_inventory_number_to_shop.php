<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Le numéro d'inventaire devient unique par boutique, et non plus globalement.
 *
 * `inventory_number` était unique sur toute la table, et Inventory::generateInventoryNumber()
 * cherchait le dernier numéro sans filtrer par boutique. Deux effets : la numérotation d'une
 * boutique était à trous, ces trous révélant l'activité des autres comptes ; et deux créations
 * simultanées lisaient le même dernier numéro, la seconde échouant sur la contrainte.
 *
 * Les factures, devis et avoirs sont passés par là en 4f63f0f — l'inventaire était resté seul
 * avec une contrainte globale.
 *
 * `completed_at` est ajouté au passage parce qu'il manquait pour répondre à une question que le
 * module pose déjà : « qu'est-ce qui a bougé depuis le dernier inventaire ? »
 * InventoryAnalysisService comparait à `inventory_date`, une date saisie à la main, ce qui
 * écartait les ventes du jour même du comptage.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropUnique(['inventory_number']);
            $table->unique(['shop_id', 'inventory_number']);

            $table->timestamp('completed_at')->nullable()->after('status');
        });

        // Les inventaires déjà terminés n'ont pas de date d'ajustement : leur date de
        // modification est ce qui s'en approche le plus, et vaut mieux qu'un null, qui les
        // ferait tous passer pour jamais terminés dans les requêtes « depuis le dernier
        // inventaire ».
        DB::table('inventories')
            ->where('status', 'completed')
            ->update(['completed_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropColumn('completed_at');
            $table->dropUnique(['shop_id', 'inventory_number']);
            $table->unique('inventory_number');
        });
    }
};
