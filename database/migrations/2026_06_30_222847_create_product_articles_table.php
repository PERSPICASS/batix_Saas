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

        Schema::create('product_articles', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->string('name'); // Nom descriptif: "Chaise IKEA - Lot février 2024 - Blanche"

            if ($driver === 'sqlite') {
                $table->text('status')->default('available');
            } else {
                $table->enum('status', ['available', 'sold', 'archived'])->default('available');
            }

            $table->timestamps();

            $table->index(['product_id', 'shop_id']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_articles');
    }
};
