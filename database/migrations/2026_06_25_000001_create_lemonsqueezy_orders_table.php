<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lemonsqueezy_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_plan_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained()->onDelete('set null');
            $table->string('lemon_order_id')->nullable()->unique();
            $table->string('lemon_subscription_id')->nullable()->unique();
            $table->string('checkout_id')->nullable();
            $table->string('customer_email');
            $table->string('customer_name')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('EUR');
            $table->string('status')->default('pending');
            $table->json('order_data')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('subscription_plan_id');
            $table->index('status');
            $table->index('lemon_subscription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lemonsqueezy_orders');
    }
};
