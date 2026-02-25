<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Rend les catégories globales (partagées par toute la plateforme)
     * au lieu d'être liées à des boutiques spécifiques.
     */
    public function up(): void
    {
        // 1. D'abord modifier la colonne pour permettre NULL
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedBigInteger('shop_id')->nullable()->change();
        });

        // 2. Supprimer les doublons - garder une seule catégorie par slug
        $slugs = DB::table('categories')
            ->select('slug')
            ->groupBy('slug')
            ->having(DB::raw('COUNT(*)'), '>', 1)
            ->pluck('slug');

        foreach ($slugs as $slug) {
            $keepId = DB::table('categories')
                ->where('slug', $slug)
                ->orderBy('id')
                ->value('id');
            
            DB::table('categories')
                ->where('slug', $slug)
                ->where('id', '!=', $keepId)
                ->delete();
        }

        // 3. Mettre shop_id à NULL pour toutes les catégories (maintenant globales)
        DB::table('categories')->update(['shop_id' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // On ne peut pas facilement restaurer les shop_id originaux
        // Cette migration est essentiellement irréversible
    }
};
