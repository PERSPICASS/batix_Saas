<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * product_id was ON DELETE CASCADE on these history tables, so deleting a Product
     * silently wiped its stock ledger and past purchase/inventory lines. Application code
     * (ProductController::destroy) now blocks deletion when history exists; this makes the
     * DB refuse it too as a last-resort safety net, instead of silently cascading.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('stock_movements', function ($table) {
            $table->dropForeign('stock_movements_product_id_foreign');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });

        Schema::table('purchase_items', function ($table) {
            $table->dropForeign('purchase_items_product_id_foreign');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });

        Schema::table('inventory_items', function ($table) {
            $table->dropForeign('inventory_items_product_id_foreign');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('stock_movements', function ($table) {
            $table->dropForeign('stock_movements_product_id_foreign');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        Schema::table('purchase_items', function ($table) {
            $table->dropForeign('purchase_items_product_id_foreign');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        Schema::table('inventory_items', function ($table) {
            $table->dropForeign('inventory_items_product_id_foreign');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }
};
