<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE pawapay_deposits MODIFY COLUMN status ENUM('INITIATED','SUBMITTED','ACCEPTED','COMPLETED','FAILED','DUPLICATE_IGNORED') NOT NULL DEFAULT 'INITIATED'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE pawapay_deposits MODIFY COLUMN status ENUM('INITIATED','SUBMITTED','COMPLETED','FAILED','DUPLICATE_IGNORED') NOT NULL DEFAULT 'INITIATED'");
    }
};
