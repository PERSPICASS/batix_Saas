<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rendre le taux de taxe d'un produit réellement paramétrable.
 *
 * `products.tax_rate` était NOT NULL DEFAULT 0, ce qui rendait deux situations
 * indistinguables : « ce produit est exonéré » et « personne n'a rempli ce champ ». Le
 * formulaire produit part justement d'un champ vide, donc l'immense majorité des produits
 * portent un 0 que personne n'a choisi. Impossible, dans ces conditions, de faire hériter
 * un produit du taux de la boutique — le 0 masquait le réglage.
 *
 * Désormais : NULL = « hérite du taux de la boutique », un nombre = un taux voulu, 0
 * compris. Les deux sont des réglages explicites.
 *
 * Les 0 existants sont convertis en NULL. C'est la lecture honnête : le champ n'ayant
 * jamais eu de valeur par défaut à la saisie, un 0 en base signifie « jamais renseigné ».
 * Conséquence à connaître : un produit qui portait 0 suivra maintenant le taux de sa
 * boutique. Pour les boutiques dont `default_tax_rate` est vide — le cas par défaut — rien
 * ne change, le taux résolu reste 0. Seules les boutiques qui ont réellement configuré un
 * taux dans les Réglages verront ce taux enfin appliqué, ce qui est précisément ce qu'on
 * attend d'un réglage.
 *
 * Effet de bord bienvenu : ProductController valide `tax_rate` en `nullable`, donc vider
 * le champ envoyait un null dans une colonne NOT NULL. C'était le même 500 que sur
 * invoice_items (voir c2a148e), simplement pas encore rencontré.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('tax_rate', 5, 2)->nullable()->default(null)->change();
        });

        DB::table('products')->where('tax_rate', 0)->update(['tax_rate' => null]);

        // 18 en dur jusque dans le schéma : une valeur par défaut qui ne s'appliquait
        // qu'aux lignes créées sans taux, et qui affirmait un taux ivoirien pour tout le
        // monde. Les contrôleurs le renseignent désormais toujours explicitement.
        Schema::table('recurring_invoice_items', function (Blueprint $table) {
            $table->decimal('tax_rate', 5, 2)->default(0)->change();
        });
    }

    public function down(): void
    {
        DB::table('products')->whereNull('tax_rate')->update(['tax_rate' => 0]);

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('tax_rate', 5, 2)->default(0)->change();
        });

        Schema::table('recurring_invoice_items', function (Blueprint $table) {
            $table->decimal('tax_rate', 5, 2)->default(18)->change();
        });
    }
};
