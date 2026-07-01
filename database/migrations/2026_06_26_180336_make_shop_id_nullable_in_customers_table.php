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

        if ($driver !== 'sqlite') {
            // SQLite doesn't support the change() method, skip for SQLite
            Schema::table('customers', function (Blueprint $table) {
                $table->unsignedBigInteger('shop_id')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver !== 'sqlite') {
            Schema::table('customers', function (Blueprint $table) {
                $table->unsignedBigInteger('shop_id')->nullable(false)->change();
            });
        }
    }
};
