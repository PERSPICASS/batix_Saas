<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Le journal des copies de produits d'une boutique vers une autre.
 *
 * Un compte à plusieurs boutiques saisit son catalogue une fois. Ouvrir une succursale ne
 * doit pas obliger à tout ressaisir : on copie les produits, avec leurs prix, leur TVA et
 * leur catégorie, et la nouvelle boutique démarre à stock zéro.
 *
 * C'est une copie, PAS un mouvement de marchandise : la boutique d'origine n'est pas
 * touchée et rien n'entre au registre des stocks. Chaque boutique approvisionne le sien.
 *
 * `depot_transfers` existe déjà mais stocke UNE LIGNE PAR PRODUIT, sans en-tête : copier
 * dix produits d'un coup y produirait dix enregistrements qu'aucune référence ne rassemble.
 * On sépare donc ici l'en-tête des lignes — une copie est un geste, pas dix.
 *
 * `nullOnDelete` sur les produits : supprimer un produit ne doit pas effacer la trace de ce
 * qui a été copié, d'où le nom conservé sur la ligne.
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
            $table->text('notes')->nullable();
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
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_transfer_items');
        Schema::dropIfExists('shop_transfers');
    }
};
