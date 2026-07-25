<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * InvoiceController@destroy called delete() on a model with no SoftDeletes, so an
 * invoice and its lines left the database for good. Two consequences, both bad:
 *
 *  - what the customer holds could no longer be reconstructed from anything but an
 *    activity-log entry that records no content;
 *  - generateInvoiceNumber() takes the highest number still present and adds one, so
 *    deleting the most recent invoice handed its number to the next one. Two distinct
 *    documents ended up sharing a number, which the [shop_id, invoice_number] unique
 *    index cannot catch because the first row was already gone. A gap in a sequence is
 *    explainable; a duplicated number is not.
 *
 * Keeping the row makes both go away: the trace survives, and the number stays taken.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
