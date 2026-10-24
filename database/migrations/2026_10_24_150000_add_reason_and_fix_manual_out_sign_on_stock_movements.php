<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 1. `reason`: a manual entry or exit now says why (breakage, theft, opening stock…).
     *
     * 2. The quantity is signed — the column's own comment says "Positive for in,
     *    negative for out", and every automatic movement follows it — except manual
     *    exits, written as +N while the stock went down by N. Deleting one then
     *    "reversed" a positive quantity, i.e. removed N a second time. Only manual
     *    exits are concerned: no reference (not a sale/invoice/purchase) and no depot
     *    (depot movements are already signed).
     *
     * The sign fix is not reverted by down(): the old values were wrong.
     */
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->string('reason', 30)->nullable()->after('notes');
        });

        DB::table('stock_movements')
            ->where('type', 'out')
            ->where('quantity', '>', 0)
            ->whereNull('reference_type')
            ->whereNull('depot_id')
            ->update(['quantity' => DB::raw('-quantity')]);
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn('reason');
        });
    }
};
