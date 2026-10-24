<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Same defect as invoices/quotes (2026_07_24_131500): purchase references are
     * generated PER SHOP (Purchase's creating hook filters on shop_id), so every shop
     * restarts at PO-YYYY-0001. The unique constraint was GLOBAL, so the second shop to
     * record its first purchase of the year hit a duplicate key. Depot transfers are
     * numbered per shop as well since DocumentNumber, so they get the same constraint.
     *
     * Aligning the DB with the generators: the reference is unique per shop.
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropUnique(['reference']);
            $table->unique(['shop_id', 'reference']);
        });

        Schema::table('depot_transfers', function (Blueprint $table) {
            $table->dropUnique(['reference']);
            $table->unique(['shop_id', 'reference']);
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'reference']);
            $table->unique(['reference']);
        });

        Schema::table('depot_transfers', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'reference']);
            $table->unique(['reference']);
        });
    }
};
