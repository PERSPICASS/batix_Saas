<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moneroo_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_id')->nullable()->unique();
            $table->string('reference')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->string('billing_cycle', 10);
            $table->string('status', 20)->default('initiated');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('XOF');
            $table->boolean('subscription_activated')->default(false);
            $table->text('checkout_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moneroo_payments');
    }
};
