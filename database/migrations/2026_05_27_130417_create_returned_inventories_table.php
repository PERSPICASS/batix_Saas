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

        Schema::create('returned_inventories', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('sale_return_id')->constrained('returns')->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');

            if ($driver === 'sqlite') {
                $table->text('reason')->default('other');
                $table->text('condition')->default('good');
                $table->text('status')->default('pending');
            } else {
                $table->enum('reason', ['defective', 'wrong_item', 'not_satisfied', 'other'])->default('other');
                $table->enum('condition', ['good', 'defective'])->default('good');
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            }

            $table->text('notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index('sale_return_id');
            $table->index('product_id');
            $table->index('shop_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returned_inventories');
    }
};
