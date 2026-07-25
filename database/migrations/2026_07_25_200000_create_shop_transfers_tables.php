<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Le document d'un transfert entre boutiques.
 *
 * Un transfert ne laissait que deux mouvements de stock portant une note. On ne pouvait ni
 * lister les transferts, ni savoir qui avait envoyé quoi, ni en annuler un.
 *
 * `depot_transfers` existe déjà mais stocke UNE LIGNE PAR PRODUIT, sans en-tête : envoyer
 * dix produits d'un coup y produit dix enregistrements indépendants, qu'aucune référence ne
 * rassemble. On sépare donc ici l'en-tête des lignes — un transfert est un geste, pas dix.
 *
 * `nullOnDelete` sur les produits : supprimer un produit ne doit pas effacer l'histoire de
 * ce qui a circulé, d'où le nom conservé sur la ligne.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('reference');
            $table->foreignId('from_shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('to_shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('completed');
            $table->text('notes')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            // Unique par boutique d'origine, comme les autres numéros de document depuis
            // 4f63f0f : une contrainte globale ferait échouer le premier transfert d'une
            // seconde boutique.
            $table->unique(['from_shop_id', 'reference']);
            $table->index('to_shop_id');
        });

        Schema::create('shop_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('target_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name');
            $table->integer('quantity');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_transfer_items');
        Schema::dropIfExists('shop_transfers');
    }
};
