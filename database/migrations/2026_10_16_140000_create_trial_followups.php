<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relances des comptes dont l'essai gratuit est terminé sans paiement
 * (trials:send-followups). Une ligne par relance envoyée : l'unicité
 * (user_id, step) garantit qu'un même email ne part jamais deux fois, même si
 * la commande tourne deux fois le même jour.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_followups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('step'); // jours après la fin de l'essai : 1, 3, 7, 14, 30
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->unique(['user_id', 'step']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('trial_followups_opted_out_at')->nullable()->after('is_demo');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('trial_followups_opted_out_at');
        });

        Schema::dropIfExists('trial_followups');
    }
};
