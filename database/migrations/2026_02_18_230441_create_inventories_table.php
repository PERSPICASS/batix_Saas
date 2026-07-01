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

        Schema::create('inventories', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->comment('User who created the inventory');
            $table->string('inventory_number')->unique()->comment('Auto-generated: INV-YYYYMM0001');
            $table->date('inventory_date');

            if ($driver === 'sqlite') {
                $table->text('status')->default('draft');
            } else {
                $table->enum('status', ['draft', 'in_progress', 'completed', 'cancelled'])->default('draft');
            }

            $table->text('notes')->nullable();
            $table->integer('total_items')->default(0)->comment('Number of products counted');
            $table->integer('total_discrepancies')->default(0)->comment('Number of products with differences');
            $table->timestamps();

            $table->index(['shop_id', 'status', 'inventory_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
