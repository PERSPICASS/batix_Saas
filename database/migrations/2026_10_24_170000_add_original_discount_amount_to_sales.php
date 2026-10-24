<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A return shrinks the sale's discount in proportion (ReturnsController::
     * recalculateSaleAmounts), so the discount granted at the counter was lost: the
     * sale and its ticket showed -800 where the customer had been given -1 000.
     *
     * Filled at the sale's FIRST return. Sales that already had returns stay null: their
     * discount was already reduced, and guessing the original back would show cents off.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('original_discount_amount', 15, 2)->nullable()->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('original_discount_amount');
        });
    }
};
