<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A product's slug is derived from its name and isn't meant to be a unique
     * identifier — the id is. Two products in the same shop can legitimately end up
     * with the same slug (e.g. "Vis M6 (Boite)" and "Vis M6 Boite" both slugify to
     * "vis-m6-boite"), and this constraint was rejecting that, breaking product
     * creation/import whenever it happened.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'slug']);
            $table->index(['shop_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['shop_id', 'slug']);
            $table->unique(['shop_id', 'slug']);
        });
    }
};
