<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * products.sku/barcode/name had no index at all — every exact-match lookup by
     * one of these (product import, depot stock import, the barcode-uniqueness
     * generator loop) did a full sequential scan. Harmless on a small catalog, but
     * on a large import this turns into O(n^2): each new row's lookup scans a table
     * that just grew by all the rows already imported, and query time comes to
     * dominate execution (measured: 3000-row import went from ~84s to ~4s after
     * this migration).
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index(['shop_id', 'sku']);
            $table->index(['shop_id', 'barcode']);
            $table->index(['shop_id', 'name']);
            // Barcode uniqueness (ProductController::generateBarcodeWithPrice) is checked
            // globally, not scoped to a shop, so it needs its own index too.
            $table->index('barcode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['shop_id', 'sku']);
            $table->dropIndex(['shop_id', 'barcode']);
            $table->dropIndex(['shop_id', 'name']);
            $table->dropIndex(['barcode']);
        });
    }
};
