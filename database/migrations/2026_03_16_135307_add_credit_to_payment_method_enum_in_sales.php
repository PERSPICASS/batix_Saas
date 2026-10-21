<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL : supprimer l'ancienne contrainte CHECK et en créer une nouvelle
            DB::statement("ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check");
            DB::statement("ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'mobile', 'multiple', 'credit'))");
        } elseif ($driver === 'mysql') {
            // MySQL
            DB::statement("ALTER TABLE sales MODIFY payment_method ENUM('cash','card','transfer','check','mobile','multiple','credit') NOT NULL DEFAULT 'cash'");
        }
        // SQLite doesn't support ENUM or MODIFY, skip for SQLite
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check");
            DB::statement("ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'mobile', 'multiple'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE sales MODIFY payment_method ENUM('cash','card','transfer','check','mobile','multiple') NOT NULL DEFAULT 'cash'");
        }
    }
};
