<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Moving stock from one shop of an account to another, in two steps: the sending
     * shop's stock goes out when it is sent, the receiving shop's comes in when the goods
     * are received. In between the transfer is "in transit" — so a transfer that never
     * arrived shows. (shop_transfers, despite the name, copies catalogue entries and moves
     * no stock at all.)
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        Schema::create('stock_transfers', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->string('reference');
            $table->foreignId('from_shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('to_shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();

            if ($driver === 'sqlite') {
                $table->text('status')->default('in_transit');
            } else {
                $table->enum('status', ['in_transit', 'received', 'cancelled'])->default('in_transit');
            }

            $table->text('notes')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamps();

            // Numbered per sending shop, like every document since DocumentNumber.
            $table->unique(['from_shop_id', 'reference']);
            $table->index(['to_shop_id', 'status']);
        });

        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('target_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name');
            $table->integer('quantity');
            // The sending shop's cost when sent: what the receiving shop folds into its average.
            $table->decimal('unit_cost', 15, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');
    }
};
