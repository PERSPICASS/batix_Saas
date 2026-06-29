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
        DB::table('subscription_plans')->where('slug', 'pro')->update(['paddle_price_id' => 'pro_01kw0bp7rzy8a9r8mndpg6g6fe']);
        DB::table('subscription_plans')->where('slug', 'growth')->update(['paddle_price_id' => 'pro_01kw0bp06s4ajfsvw9xe3wskz6']);
        DB::table('subscription_plans')->where('slug', 'starter')->update(['paddle_price_id' => 'pro_01kw0bnny7yqa7a3275k42d8y3']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('subscription_plans')->whereIn('slug', ['pro', 'growth', 'starter'])->update(['paddle_price_id' => null]);
    }
};
