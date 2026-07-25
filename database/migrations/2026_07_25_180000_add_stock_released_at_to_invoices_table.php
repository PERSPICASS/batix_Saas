<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Quand une facture a sorti sa marchandise du stock.
 *
 * Les factures ne bougeaient pas le stock — alors même que le contrôleur marquait déjà les
 * articles sérialisés comme vendus dans le même flux. Une facture touchait donc
 * l'inventaire à moitié.
 *
 * Le moment de la sortie est l'ÉMISSION, pas la création des lignes : un brouillon se
 * modifie librement, et ses lignes sont détruites puis recréées à chaque enregistrement.
 * Sortir la marchandise à la création aurait décrémenté à chaque modification.
 *
 * D'où cette marque plutôt qu'une déduction depuis le statut : elle rend l'opération
 * idempotente. Émettre puis marquer payée ne sort la marchandise qu'une fois, et une
 * annulation la remet en la remettant à null.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->timestamp('stock_released_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('stock_released_at');
        });
    }
};
