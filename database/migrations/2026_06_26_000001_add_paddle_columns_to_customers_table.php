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
        // Add Paddle columns to existing customers table
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'billable_type')) {
                $table->string('billable_type')->nullable()->after('id');
            }
            if (!Schema::hasColumn('customers', 'billable_id')) {
                $table->unsignedBigInteger('billable_id')->nullable()->after('billable_type');
            }
            if (!Schema::hasColumn('customers', 'paddle_id')) {
                $table->string('paddle_id')->nullable()->unique()->after('billable_id');
            }
            if (!Schema::hasColumn('customers', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable()->after('email');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['billable_type', 'billable_id', 'paddle_id', 'trial_ends_at']);
        });
    }
};
