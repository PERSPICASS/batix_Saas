<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin_platforme', 'admin', 'manager', 'cashier', 'staff', 'caisse', 'employee'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE users DROP CHECK IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin_platforme', 'admin', 'manager', 'cashier', 'staff', 'caisse', 'employee'))");
        }
        // SQLite doesn't support DROP CONSTRAINT, so we skip it for SQLite
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'manager', 'cashier', 'staff', 'caisse', 'employee'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE users DROP CHECK IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'manager', 'cashier', 'staff', 'caisse', 'employee'))");
        }
    }
};
