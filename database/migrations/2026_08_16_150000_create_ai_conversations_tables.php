<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Conversations de l'assistant IA, conservées côté serveur.
 *
 * Jusqu'ici l'historique ne vivait que dans le `sessionStorage` de l'onglet : il
 * disparaissait à la déconnexion et ne suivait pas l'utilisateur d'un appareil à
 * l'autre.
 *
 * Une conversation appartient à un UTILISATEUR et à une BOUTIQUE. Les deux comptent :
 * l'assistant force la boutique courante sur chaque appel d'outil, donc un fil ouvert
 * dans une boutique n'a aucun sens dans une autre — et un employé n'a pas à relire les
 * échanges de son collègue.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            // cascadeOnDelete : une conversation n'a aucune valeur sans son auteur ni sa
            // boutique, et laisser des orphelins bloquerait la suppression d'un compte
            // (voir les FK RESTRICT qui gênent déjà la suppression d'une boutique).
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            // Dernière activité, distincte de updated_at : c'est l'ordre d'affichage de
            // la liste ET le critère de purge.
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            // Liste d'un utilisateur dans une boutique, la plus récente d'abord :
            // c'est la seule requête que fait la modale à chaque ouverture.
            $table->index(['user_id', 'shop_id', 'last_message_at']);
            // Purge : balayage par ancienneté, tous utilisateurs confondus.
            $table->index('last_message_at');
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_conversation_id')->constrained()->cascadeOnDelete();
            $table->string('role', 16);
            $table->text('content');
            $table->timestamps();

            $table->index(['ai_conversation_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
    }
};
