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
        // Add Paddle columns to existing subscriptions table
        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'billable_type')) {
                $table->string('billable_type')->nullable()->after('id');
            }
            if (!Schema::hasColumn('subscriptions', 'billable_id')) {
                $table->unsignedBigInteger('billable_id')->nullable()->after('billable_type');
            }
            if (!Schema::hasColumn('subscriptions', 'paddle_id')) {
                $table->string('paddle_id')->nullable()->unique()->after('billable_id');
            }
            if (!Schema::hasColumn('subscriptions', 'paused_at')) {
                $table->timestamp('paused_at')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['billable_type', 'billable_id', 'paddle_id', 'paused_at']);
        });
    }
};
