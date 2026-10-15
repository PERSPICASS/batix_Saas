<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un devis peut servir de liste de matériel sans chiffrage, ou n'afficher que le total
 * global. Les deux options sont indépendantes, et vraies par défaut : les devis
 * existants restent rendus exactement comme avant.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->boolean('show_unit_prices')->default(true)->after('terms');
            $table->boolean('show_amounts')->default(true)->after('show_unit_prices');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn(['show_unit_prices', 'show_amounts']);
        });
    }
};
