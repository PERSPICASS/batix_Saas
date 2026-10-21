<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Situer un mouvement de stock : au comptoir, ou dans quel dépôt.
 *
 * Le registre ne savait pas exprimer « ce mouvement concerne le dépôt X ». C'est pourquoi
 * les quatre chemins qui modifient `depot_products.quantity` n'écrivaient rien : entrée en
 * dépôt, saisie directe, transfert dépôt→dépôt, et le côté dépôt d'un transfert vers la
 * boutique. Le stock d'un dépôt n'avait donc aucun historique — à la question « pourquoi ce
 * dépôt affiche 12 ? », l'application n'avait aucune réponse.
 *
 * `depot_id` nul = le stock du comptoir, celui que porte `products.stock_quantity`. Non nul
 * = le dépôt concerné, dont la quantité vit dans `depot_products`. Les deux pools restent
 * distincts, mais ils partagent enfin un journal.
 *
 * `nullOnDelete` plutôt que `cascade` : supprimer un dépôt ne doit pas effacer l'histoire
 * de ce qui y est passé.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('depot_id')->nullable()->after('product_id')
                ->constrained()->nullOnDelete();

            // Consulter l'historique d'un dépôt est la requête que tout ceci rend possible.
            $table->index(['depot_id', 'product_id', 'movement_date'], 'stock_movements_depot_idx');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('stock_movements_depot_idx');
            $table->dropConstrainedForeignId('depot_id');
        });
    }
};
