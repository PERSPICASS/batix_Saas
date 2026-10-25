<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The daily alerts email (alerts:send-daily): one row per owner and day, reserved
     * before sending so two runs never send it twice; and the one-click opt-out.
     */
    public function up(): void
    {
        Schema::create('alert_digests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('sent_on');
            $table->timestamps();

            $table->unique(['user_id', 'sent_on']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('alerts_opted_out_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_digests');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('alerts_opted_out_at'));
    }
};
