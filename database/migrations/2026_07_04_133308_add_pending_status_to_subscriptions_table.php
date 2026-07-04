<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->timestamp('started_at')->nullable()->change();
            });
            return;
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->enum('status', ['active', 'cancelled', 'expired', 'trial', 'pending'])->default('active')->change();
            $table->timestamp('started_at')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->timestamp('started_at')->nullable(false)->change();
            });
            return;
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->enum('status', ['active', 'cancelled', 'expired', 'trial'])->default('active')->change();
            $table->timestamp('started_at')->nullable(false)->change();
        });
    }
};
