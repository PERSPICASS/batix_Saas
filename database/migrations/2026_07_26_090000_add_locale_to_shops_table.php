<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La langue des documents émis par une boutique.
 *
 * Elle venait jusqu'ici de `users.locale`, c'est-à-dire de la langue d'INTERFACE choisie
 * par le gérant. Un client abidjanais recevait donc un devis en anglais parce que son
 * fournisseur naviguait en anglais — et le PDF joint restait en français, ses gabarits
 * étant écrits en dur. Mail et pièce jointe pouvaient se contredire.
 *
 * La langue d'un document destiné au client relève de la boutique, pas d'une préférence
 * d'affichage. `users.locale` continue de gouverner l'interface, et rien d'autre.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->string('locale', 5)->default('fr')->after('currency');
        });
    }

    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn('locale');
        });
    }
};
