<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('subscription_plans')->where('slug', 'starter')->update(['paddle_price_id_yearly' => 'pri_01kwcexppmnz8dyh4xanzg18g8']);
        DB::table('subscription_plans')->where('slug', 'growth')->update(['paddle_price_id_yearly' => 'pri_01kwcevxy47sr6w8q7wce4vx4q']);
        DB::table('subscription_plans')->where('slug', 'pro')->update(['paddle_price_id_yearly' => 'pri_01kwcet0jbth889tj3fvpvn7zr']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('subscription_plans')->whereIn('slug', ['starter', 'growth', 'pro'])->update(['paddle_price_id_yearly' => null]);
    }
};
