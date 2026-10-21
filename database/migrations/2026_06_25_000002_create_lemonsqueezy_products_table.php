<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lemonsqueezy_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->unique()->constrained()->onDelete('cascade');
            $table->string('lemon_product_id')->unique();
            $table->string('lemon_variant_id')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('EUR');
            $table->json('product_data')->nullable();
            $table->json('variant_data')->nullable();
            $table->timestamps();

            $table->index('subscription_plan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lemonsqueezy_products');
    }
};
