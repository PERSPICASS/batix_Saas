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

        Schema::create('pawapay_deposits', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->uuid('deposit_id')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_plan_id')->constrained()->onDelete('restrict');
            $table->string('billing_cycle'); // monthly, yearly
            $table->decimal('amount', 10, 2);
            $table->string('currency', 10);
            $table->string('correspondent');
            $table->string('msisdn', 30);

            if ($driver === 'sqlite') {
                $table->text('status')->default('INITIATED');
            } else {
                $table->enum('status', ['INITIATED', 'SUBMITTED', 'COMPLETED', 'FAILED', 'DUPLICATE_IGNORED'])->default('INITIATED');
            }

            $table->boolean('subscription_activated')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('deposit_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pawapay_deposits');
    }
};
