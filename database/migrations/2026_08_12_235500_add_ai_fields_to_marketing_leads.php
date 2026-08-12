<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketing_leads', function (Blueprint $table) {
            $table->text('ai_summary')->nullable()->after('notes');
            $table->text('ai_next_action')->nullable()->after('ai_summary');
            $table->text('whatsapp_script')->nullable()->after('ai_next_action');
            $table->timestamp('scored_at')->nullable()->after('last_contact_at');
        });
    }

    public function down(): void
    {
        Schema::table('marketing_leads', function (Blueprint $table) {
            $table->dropColumn(['ai_summary', 'ai_next_action', 'whatsapp_script', 'scored_at']);
        });
    }
};
