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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('subcategory_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('slug');
            $table->string('sku')->nullable(); // Référence produit
            $table->string('barcode')->nullable(); // Code-barres
            $table->text('description')->nullable();
            $table->decimal('purchase_price', 10, 2)->default(0); // Prix d'achat
            $table->decimal('selling_price', 10, 2)->default(0); // Prix de vente
            $table->decimal('tax_rate', 5, 2)->default(0); // Taux de TVA
            $table->integer('stock_quantity')->default(0); // Quantité en stock
            $table->integer('min_stock_alert')->nullable(); // Alerte stock minimum
            $table->string('unit')->default('unité'); // unité, kg, litre, etc.
            $table->string('image')->nullable(); // Image du produit
            $table->boolean('is_active')->default(true);
            $table->boolean('track_stock')->default(true); // Suivre le stock
            $table->timestamps();
            
            $table->unique(['shop_id', 'slug']);
            $table->index(['shop_id', 'category_id']);
            $table->index(['shop_id', 'subcategory_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
