<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Invoice and quote numbers are generated PER SHOP: Invoice::generateInvoiceNumber()
     * and Quote's numbering both scope their "last number" lookup by shop_id, so every
     * shop restarts its own INV-YYYYMM0001 / DEV-... sequence. But the unique constraint
     * was GLOBAL (a plain ->unique() on the number column alone), so two shops generating
     * the same first number of the month collided — and because each retry re-queries
     * within the same (empty) shop scope, it kept regenerating the identical number and
     * ConcurrencySafe::retryOnDuplicate exhausted its attempts, surfacing a 500.
     *
     * Aligning the DB with the generators: the number is unique PER SHOP, not globally.
     * (Sales keep a global ticket_number on purpose — their generator already queries
     * globally — so they are intentionally left untouched.)
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique(['invoice_number']);
            $table->unique(['shop_id', 'invoice_number']);
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropUnique(['quote_number']);
            $table->unique(['shop_id', 'quote_number']);
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'invoice_number']);
            $table->unique(['invoice_number']);
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'quote_number']);
            $table->unique(['quote_number']);
        });
    }
};
