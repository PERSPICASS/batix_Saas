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

        Schema::create('depot_transfers', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->string('reference')->unique(); // ex: TRF-2026-0001
            $table->foreignId('depot_id')->constrained()->onDelete('cascade');
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // qui a fait le transfert
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->text('notes')->nullable();

            if ($driver === 'sqlite') {
                $table->text('status')->default('completed');
            } else {
                $table->enum('status', ['pending', 'completed', 'cancelled'])->default('completed');
            }

            $table->timestamp('transferred_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('depot_transfers');
    }
};
