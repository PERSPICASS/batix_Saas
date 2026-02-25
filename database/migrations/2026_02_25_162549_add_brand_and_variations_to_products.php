<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ajouter la marque et le flag parent aux produits
        Schema::table('products', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('name'); // Marque du produit
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('products')->onDelete('cascade'); // Pour les variations
            $table->boolean('has_variations')->default(false)->after('is_active'); // Indique si le produit a des variations
        });

        // Créer la table des attributs de variation (ex: Couleur, Taille, etc.)
        Schema::create('product_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->string('name'); // Ex: Couleur, Taille, Poids
            $table->string('slug');
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->unique(['shop_id', 'slug']);
        });

        // Créer la table des valeurs d attributs (ex: Rouge, Bleu, S, M, L)
        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained('product_attributes')->onDelete('cascade');
            $table->string('value'); // Ex: Rouge, Bleu, S, M, L, 5kg
            $table->string('slug');
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->unique(['attribute_id', 'slug']);
        });

        // Table pivot pour lier les produits (variations) a leurs valeurs d attributs
        Schema::create('product_variation_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade'); // La variation (produit enfant)
            $table->foreignId('attribute_value_id')->constrained('product_attribute_values')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['product_id', 'attribute_value_id'], 'pva_product_attr_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variation_attributes');
        Schema::dropIfExists('product_attribute_values');
        Schema::dropIfExists('product_attributes');

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['brand', 'parent_id', 'has_variations']);
        });
    }
};
