<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        Schema::create('jeko_payment_requests', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->uuid('payment_request_id')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->onDelete('cascade');

            if ($driver === 'sqlite') {
                $table->text('billing_cycle');
                $table->text('payment_method')->default('wave');
                $table->text('status')->default('pending');
            } else {
                $table->enum('billing_cycle', ['monthly', 'yearly']);
                $table->enum('payment_method', ['wave', 'orange', 'mtn', 'moov', 'djamo'])->default('wave');
                $table->enum('status', ['pending', 'success', 'error'])->default('pending');
            }

            $table->integer('amount_cents');
            $table->string('currency', 3)->default('XOF');
            $table->string('reference')->unique();
            $table->boolean('subscription_activated')->default(false);
            $table->text('redirect_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jeko_payment_requests');
    }
};
