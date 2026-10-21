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

        Schema::table('fixed_costs', function (Blueprint $table) use ($driver) {
            if ($driver === 'sqlite') {
                $table->text('billing_cycle')->default('monthly')->after('currency');
            } else {
                $table->enum('billing_cycle', ['monthly', 'annual'])->default('monthly')->after('currency');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fixed_costs', function (Blueprint $table) {
            $table->dropColumn('billing_cycle');
        });
    }
};
