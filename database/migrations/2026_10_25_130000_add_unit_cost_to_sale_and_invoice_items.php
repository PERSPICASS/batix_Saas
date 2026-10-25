<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The cost of an item, frozen when it is sold or invoiced.
     *
     * Margins were computed with the product's CURRENT cost (weighted average, else last
     * purchase price): every new purchase at a different price rewrote the margin of every
     * past sale, so January's margin was not the same in June. Existing lines get today's
     * cost — exactly what they were already computed with — so their margin stops moving
     * from now on.
     */
    public function up(): void
    {
        foreach (['sale_items', 'invoice_items'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->decimal('unit_cost', 15, 2)->nullable()->after('unit_price');
            });

            DB::table($table)->whereNotNull('product_id')->update([
                'unit_cost' => DB::raw("(SELECT COALESCE(products.average_cost, products.purchase_price, 0) FROM products WHERE products.id = {$table}.product_id)"),
            ]);
        }
    }

    public function down(): void
    {
        foreach (['sale_items', 'invoice_items'] as $table) {
            Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropColumn('unit_cost'));
        }
    }
};
