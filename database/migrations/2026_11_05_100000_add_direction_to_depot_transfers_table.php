<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un transfert dépôt ↔ boutique a désormais un sens : `to_shop` (le dépôt alimente la
 * boutique, seul cas qui existait — d'où la valeur par défaut pour les lignes en place)
 * ou `to_depot` (la boutique renvoie du stock au dépôt).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('depot_transfers', function (Blueprint $table) {
            $table->string('direction', 16)->default('to_shop')->after('shop_id');
        });
    }

    public function down(): void
    {
        Schema::table('depot_transfers', function (Blueprint $table) {
            $table->dropColumn('direction');
        });
    }
};
