<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('depot_products', function (Blueprint $table) {
            // Supprimer l'ancienne FK avec CASCADE
            $table->dropForeign(['product_id']);

            // Recréer avec RESTRICT : empêche la suppression du produit
            // si une entrée dépôt existe encore, sans jamais supprimer en cascade
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('depot_products', function (Blueprint $table) {
            $table->dropForeign(['product_id']);

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('cascade');
        });
    }
};
