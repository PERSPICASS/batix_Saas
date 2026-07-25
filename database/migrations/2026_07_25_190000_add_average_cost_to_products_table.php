<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Le coût unitaire moyen pondéré (CUMP), pour valoriser le stock.
 *
 * `purchase_price` existe déjà, mais c'est le prix du DERNIER achat : il ne dit pas ce que
 * vaut le stock détenu. Une quincaillerie qui a acheté 100 sacs à 4 000 puis 100 à 5 000 en
 * détient 200 valant 900 000, pas 1 000 000. Sans moyenne pondérée, la valeur du stock —
 * là où est immobilisée la trésorerie — n'est calculable nulle part.
 *
 * Nullable à dessein : tant qu'aucune réception n'a alimenté la moyenne, on retombe sur
 * `purchase_price` plutôt que d'afficher zéro. La moyenne converge ensuite vers la réalité
 * à chaque entrée.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('average_cost', 12, 2)->nullable()->after('purchase_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('average_cost');
        });
    }
};
