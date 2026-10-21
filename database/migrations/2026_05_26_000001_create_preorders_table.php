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

        Schema::create('preorders', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('quantity_ordered');
            $table->decimal('unit_price', 15, 2);
            $table->date('expected_delivery_date');
            $table->decimal('deposit_amount', 15, 2)->nullable();

            if ($driver === 'sqlite') {
                $table->text('status')->default('pending');
            } else {
                $table->enum('status', ['pending', 'confirmed', 'ready', 'completed', 'cancelled'])->default('pending');
            }

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('shop_id');
            $table->index('status');
            $table->index('expected_delivery_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preorders');
    }
};
