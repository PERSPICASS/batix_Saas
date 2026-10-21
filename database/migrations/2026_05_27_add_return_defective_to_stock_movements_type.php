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
        $driver = DB::getDriverName();

        // For MySQL and SQLite: need to drop the column and recreate it with the new enum values
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('stock_movements', function (Blueprint $table) use ($driver) {
            if ($driver === 'sqlite') {
                $table->text('type')
                    ->comment('in=entrée, out=sortie, transfer=transfert, adjustment=ajustement, sale=vente, return=retour, return_defective=retour défectueux')
                    ->after('user_id');
            } else {
                $table->enum('type', ['in', 'out', 'transfer', 'adjustment', 'sale', 'return', 'return_defective'])
                    ->comment('in=entrée, out=sortie, transfer=transfert, adjustment=ajustement, sale=vente, return=retour, return_defective=retour défectueux')
                    ->after('user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('stock_movements', function (Blueprint $table) use ($driver) {
            if ($driver === 'sqlite') {
                $table->text('type')
                    ->comment('in=entrée, out=sortie, transfer=transfert, adjustment=ajustement, sale=vente, return=retour')
                    ->after('user_id');
            } else {
                $table->enum('type', ['in', 'out', 'transfer', 'adjustment', 'sale', 'return'])
                    ->comment('in=entrée, out=sortie, transfer=transfert, adjustment=ajustement, sale=vente, return=retour')
                    ->after('user_id');
            }
        });
    }
};
