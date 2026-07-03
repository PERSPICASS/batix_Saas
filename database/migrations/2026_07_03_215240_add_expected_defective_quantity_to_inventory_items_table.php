<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->integer('expected_defective_quantity')->default(0)->after('expected_quantity')
                ->comment('Defective quantity in system before count');
            $table->integer('defective_difference')->default(0)->after('difference')
                ->comment('defective_quantity - expected_defective_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn(['expected_defective_quantity', 'defective_difference']);
        });
    }
};
