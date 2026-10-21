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
        Schema::create('shop_supplier', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['shop_id', 'supplier_id']);
        });
        
        // Migrer les données existantes de shop_id vers la table pivot
        $suppliers = \DB::table('suppliers')->whereNotNull('shop_id')->get();
        foreach ($suppliers as $supplier) {
            \DB::table('shop_supplier')->insert([
                'shop_id' => $supplier->shop_id,
                'supplier_id' => $supplier->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Supprimer la colonne shop_id de la table suppliers
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropColumn('shop_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restaurer la colonne shop_id
        Schema::table('suppliers', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->constrained()->onDelete('cascade');
        });
        
        // Migrer les données de la table pivot vers shop_id (prendre la première boutique)
        $pivots = \DB::table('shop_supplier')
            ->select('supplier_id', \DB::raw('MIN(shop_id) as shop_id'))
            ->groupBy('supplier_id')
            ->get();
        
        foreach ($pivots as $pivot) {
            \DB::table('suppliers')
                ->where('id', $pivot->supplier_id)
                ->update(['shop_id' => $pivot->shop_id]);
        }
        
        Schema::dropIfExists('shop_supplier');
    }
};
