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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['in', 'out', 'transfer', 'adjustment', 'sale', 'return'])->comment('in=entrée, out=sortie, transfer=transfert, adjustment=ajustement, sale=vente, return=retour');
            $table->integer('quantity')->comment('Positive for in, negative for out');
            $table->decimal('unit_cost', 10, 2)->nullable()->comment('Cost per unit for this movement');
            $table->foreignId('reference_id')->nullable()->comment('ID of related sale, invoice, etc.');
            $table->string('reference_type')->nullable()->comment('Type of reference: Sale, Invoice, Transfer, etc.');
            $table->text('notes')->nullable();
            $table->date('movement_date');
            $table->timestamps();
            
            $table->index(['shop_id', 'product_id', 'movement_date']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
