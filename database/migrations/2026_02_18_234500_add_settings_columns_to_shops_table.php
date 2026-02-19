<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->string('website')->nullable()->after('email');
            $table->decimal('default_tax_rate', 5, 2)->nullable()->after('currency');
            $table->string('invoice_prefix', 10)->nullable()->after('default_tax_rate');
            $table->text('invoice_footer')->nullable()->after('invoice_prefix');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn(['website', 'default_tax_rate', 'invoice_prefix', 'invoice_footer']);
        });
    }
};
