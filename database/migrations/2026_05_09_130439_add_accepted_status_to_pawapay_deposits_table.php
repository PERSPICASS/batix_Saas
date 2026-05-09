<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE pawapay_deposits DROP CONSTRAINT IF EXISTS pawapay_deposits_status_check");
            DB::statement("ALTER TABLE pawapay_deposits ADD CONSTRAINT pawapay_deposits_status_check CHECK (status IN ('INITIATED','SUBMITTED','ACCEPTED','COMPLETED','FAILED','DUPLICATE_IGNORED'))");
        } else {
            DB::statement("ALTER TABLE pawapay_deposits MODIFY COLUMN status ENUM('INITIATED','SUBMITTED','ACCEPTED','COMPLETED','FAILED','DUPLICATE_IGNORED') NOT NULL DEFAULT 'INITIATED'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE pawapay_deposits DROP CONSTRAINT IF EXISTS pawapay_deposits_status_check");
            DB::statement("ALTER TABLE pawapay_deposits ADD CONSTRAINT pawapay_deposits_status_check CHECK (status IN ('INITIATED','SUBMITTED','COMPLETED','FAILED','DUPLICATE_IGNORED'))");
        } else {
            DB::statement("ALTER TABLE pawapay_deposits MODIFY COLUMN status ENUM('INITIATED','SUBMITTED','COMPLETED','FAILED','DUPLICATE_IGNORED') NOT NULL DEFAULT 'INITIATED'");
        }
    }
};
