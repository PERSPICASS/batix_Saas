<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Identifiant généré par le client pour rendre l'enregistrement d'une vente idempotent.
 *
 * Une vente saisie hors ligne est rejouée depuis la file d'attente du téléphone. Sur un
 * réseau instable, le client peut très bien avoir envoyé la vente, ne jamais recevoir la
 * réponse, et réessayer : sans cette contrainte, la vente serait enregistrée deux fois et
 * le stock décrémenté deux fois. C'est de l'argent et du stock réels, pas un doublon
 * d'affichage.
 *
 * L'unicité est globale et non par boutique : un UUID v4 est unique par construction, et
 * un index global permet de détecter le doublon sans connaître la boutique au préalable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // string(36) plutôt que uuid() : le type natif diffère entre PostgreSQL
            // (prod), MySQL et SQLite (tests), là où une chaîne se comporte pareil
            // partout.
            $table->string('client_uuid', 36)->nullable()->after('ticket_number');
            $table->unique('client_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['client_uuid']);
            $table->dropColumn('client_uuid');
        });
    }
};
