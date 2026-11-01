<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relances des inscrits qui n'ont pas créé leur boutique (signups:send-shop-reminders).
 * Une ligne par relance envoyée ; l'unicité (user_id, step) empêche tout doublon.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signup_followups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('step'); // jours après l'inscription : 1, 3
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->unique(['user_id', 'step']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signup_followups');
    }
};
