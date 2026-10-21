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
        // Use Paddle Price IDs (pri_*), not Product IDs (pro_*)
        DB::table('subscription_plans')->where('slug', 'pro')->update(['paddle_price_id' => 'pri_01kw2hybzhy9dvpzm9nvm851p8']);
        DB::table('subscription_plans')->where('slug', 'growth')->update(['paddle_price_id' => 'pri_01kw2hzxvs5zmag2xngcs2wkbw']);
        DB::table('subscription_plans')->where('slug', 'starter')->update(['paddle_price_id' => 'pri_01kw2j14wsvbxxpcsdxgmk9r6c']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('subscription_plans')->whereIn('slug', ['pro', 'growth', 'starter'])->update(['paddle_price_id' => null]);
    }
};
