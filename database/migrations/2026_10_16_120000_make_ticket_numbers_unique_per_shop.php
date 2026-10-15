<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ticket numbers become unique per shop, as invoice and quote numbers did on
 * 2026-07-24. The global constraint forced one platform-wide daily counter,
 * capped at 9999 sales a day for all tenants together (see
 * Sale::generateTicketNumber). Existing numbers are globally unique, hence
 * unique per shop too: the new constraint applies to the current data as is.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['ticket_number']);
            $table->unique(['shop_id', 'ticket_number']);
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['shop_id', 'ticket_number']);
            $table->unique(['ticket_number']);
        });
    }
};
