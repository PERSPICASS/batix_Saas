<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un mouvement de stock n'a pas toujours un auteur — et n'en perd jamais l'histoire.
 *
 * Deux défauts de la table d'origine, que la commande stock:audit met en évidence :
 *
 * 1. `user_id` était obligatoire. Or tout ce qui est écrit par le système — une reprise de
 *    cohérence, une tâche planifiée — n'a personne derrière. Il fallait alors attribuer le
 *    mouvement à un utilisateur qui n'a rien fait, ce qui pollue précisément ce qu'un
 *    registre sert à établir.
 *
 * 2. La clé étrangère était en `cascade` : supprimer un utilisateur effaçait TOUS ses
 *    mouvements de stock. Le départ d'un employé emportait l'historique des entrées et
 *    sorties qu'il avait saisies — dans un registre d'audit, c'est l'inverse de ce qu'on
 *    attend. `nullOnDelete` conserve le mouvement et oublie seulement son auteur.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
