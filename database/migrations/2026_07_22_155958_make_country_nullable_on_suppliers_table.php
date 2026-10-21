<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * suppliers.country was NOT NULL with a 'Maroc' default, but the form
     * validates it as nullable and sends null when left empty. On Postgres a
     * default only applies when the column is omitted, not when null is passed
     * explicitly, so creating a supplier without a country crashed with a
     * not-null violation. Align it with users.country (nullable, no default).
     */
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('country')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        // Backfill nulls with an empty string before restoring the NOT NULL
        // constraint, otherwise the rollback would fail on any supplier saved
        // without a country. No default value is reintroduced.
        DB::table('suppliers')->whereNull('country')->update(['country' => '']);

        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('country')->nullable(false)->change();
        });
    }
};
