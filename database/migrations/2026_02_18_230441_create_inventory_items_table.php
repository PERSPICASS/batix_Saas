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
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('expected_quantity')->comment('Quantity in system before count');
            $table->integer('counted_quantity')->nullable()->comment('Actual counted quantity');
            $table->integer('difference')->default(0)->comment('counted - expected');
            $table->decimal('unit_cost', 10, 2)->nullable()->comment('Cost per unit at time of inventory');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['inventory_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
