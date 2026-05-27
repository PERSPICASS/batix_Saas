<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL: need to drop the column and recreate it with the new enum values
        // This is the only way to add a value to an ENUM in MySQL
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->enum('type', ['in', 'out', 'transfer', 'adjustment', 'sale', 'return', 'return_defective'])
                ->comment('in=entrée, out=sortie, transfer=transfert, adjustment=ajustement, sale=vente, return=retour, return_defective=retour défectueux')
                ->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->enum('type', ['in', 'out', 'transfer', 'adjustment', 'sale', 'return'])
                ->comment('in=entrée, out=sortie, transfer=transfert, adjustment=ajustement, sale=vente, return=retour')
                ->after('user_id');
        });
    }
};
