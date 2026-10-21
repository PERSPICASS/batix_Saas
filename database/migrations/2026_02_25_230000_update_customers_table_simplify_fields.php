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
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['city', 'postal_code', 'country', 'tax_number']);
            // Optionally, rename address to address (already exists)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('city')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->default('France');
            $table->string('tax_number')->nullable();
        });
    }
};
