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
        Schema::table('sales', function (Blueprint $table) {
            // Reste à payer (0 si vente comptant)
            $table->decimal('remaining_amount', 15, 2)->default(0)->after('change_amount');
            // Date d'échéance de remboursement (optionnel)
            $table->date('credit_due_date')->nullable()->after('remaining_amount');

            // Ajouter 'credit' comme mode de paiement
            // SQLite ne supporte pas la modification d'enum, on gère ça au niveau applicatif
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['remaining_amount', 'credit_due_date']);
        });
    }
};
