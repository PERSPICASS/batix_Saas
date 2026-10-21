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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->boolean('is_active')->default(true)->after('email_verified_at');
        });

        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            // SQLite doesn't support ENUM, use TEXT instead
            Schema::table('users', function (Blueprint $table) {
                $table->text('role')->default('staff')->after('is_active');
            });
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['super_admin', 'admin', 'manager', 'cashier', 'staff'])->default('staff')->after('is_active');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropColumn(['shop_id', 'role', 'is_active']);
        });
    }
};
