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
        } else {
            // MySQL / SQLite
            DB::statement("ALTER TABLE sales MODIFY payment_method ENUM('cash','card','transfer','check','mobile','multiple','credit') NOT NULL DEFAULT 'cash'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check");
            DB::statement("ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check CHECK (payment_method IN ('cash', 'card', 'transfer', 'check', 'mobile', 'multiple'))");
        } else {
            DB::statement("ALTER TABLE sales MODIFY payment_method ENUM('cash','card','transfer','check','mobile','multiple') NOT NULL DEFAULT 'cash'");
        }
    }
};
