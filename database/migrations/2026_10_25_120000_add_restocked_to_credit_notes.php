<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Whether the credited goods went back into stock. A credit note can correct a price
     * (nothing comes back) or record goods returned: the person issuing it says which, and
     * the credit note keeps the answer — before this, it never put anything back.
     */
    public function up(): void
    {
        Schema::table('credit_notes', function (Blueprint $table) {
            $table->boolean('restocked')->default(false)->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('credit_notes', function (Blueprint $table) {
            $table->dropColumn('restocked');
        });
    }
};
