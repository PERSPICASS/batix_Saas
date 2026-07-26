<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * « Pas compté » cesse d'être confondu avec « compté zéro ».
 *
 * `counted_quantity` était déjà nullable, mais le contrôleur écrasait le null par 0 avant
 * l'enregistrement : une ligne ajoutée puis laissée vide se retrouvait à 0, et l'application de
 * l'inventaire mettait le stock du produit à zéro. Ajouter un produit sans le compter effaçait
 * donc son stock.
 *
 * `defective_quantity` n'était même pas nullable, alors que la distinction vaut aussi pour lui :
 * 0 signifie « aucune pièce défectueuse trouvée », ce qui n'est pas la même information que
 * « la ligne n'a pas été inventoriée ».
 *
 * Conséquence voulue : un inventaire partiel devient un cas normal, et non un piège.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->integer('defective_quantity')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->integer('defective_quantity')->default(0)->nullable(false)->change();
        });
    }
};
