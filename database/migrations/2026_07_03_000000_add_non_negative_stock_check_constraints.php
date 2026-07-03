<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * SQLite (used in tests) doesn't support ALTER TABLE ADD CONSTRAINT, so the
     * DB-level check is only enforced on mysql/pgsql. Application code (lockForUpdate
     * + ValidationException in DepotController/SaleCreationService) is the primary
     * guard everywhere; this constraint is the last-resort safety net in production.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'pgsql'])) {
            DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_stock_quantity_non_negative CHECK (stock_quantity >= 0)');
            DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_defective_stock_non_negative CHECK (defective_stock_quantity >= 0)');
            DB::statement('ALTER TABLE depot_products ADD CONSTRAINT chk_depot_products_quantity_non_negative CHECK (quantity >= 0)');
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE products DROP CHECK chk_products_stock_quantity_non_negative');
            DB::statement('ALTER TABLE products DROP CHECK chk_products_defective_stock_non_negative');
            DB::statement('ALTER TABLE depot_products DROP CHECK chk_depot_products_quantity_non_negative');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE products DROP CONSTRAINT chk_products_stock_quantity_non_negative');
            DB::statement('ALTER TABLE products DROP CONSTRAINT chk_products_defective_stock_non_negative');
            DB::statement('ALTER TABLE depot_products DROP CONSTRAINT chk_depot_products_quantity_non_negative');
        }
    }
};
