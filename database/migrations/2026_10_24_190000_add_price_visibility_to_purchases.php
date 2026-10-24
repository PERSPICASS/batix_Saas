<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ce que le bon de commande imprimé montre au fournisseur, comme pour les devis
     * (2026_10_15_100000) : sans les prix, il devient une liste de quantités à chiffrer.
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->boolean('show_unit_prices')->default(true)->after('internal_notes');
            $table->boolean('show_amounts')->default(true)->after('show_unit_prices');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn(['show_unit_prices', 'show_amounts']);
        });
    }
};
