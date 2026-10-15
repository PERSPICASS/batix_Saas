<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Comptes de démonstration (démos commerciales, tests en prod) : ils restent
 * fonctionnels mais sont exclus des chiffres de l'admin plateforme (MRR,
 * revenus, compteurs). Posé sur le compte propriétaire (super_admin) ; son
 * personnel et ses boutiques suivent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_demo')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_demo');
        });
    }
};
