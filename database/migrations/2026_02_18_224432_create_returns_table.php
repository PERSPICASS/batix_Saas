<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        Schema::create('returns', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->onDelete('cascade'); // Vente originale
            $table->foreignId('sale_item_id')->constrained()->onDelete('cascade'); // Article retourné
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Employé qui a traité le retour
            $table->integer('quantity_returned'); // Quantité retournée
            $table->decimal('refund_amount', 15, 2); // Montant remboursé

            if ($driver === 'sqlite') {
                $table->text('refund_method')->default('cash');
                $table->text('reason')->default('other');
            } else {
                $table->enum('refund_method', ['cash', 'card', 'store_credit', 'exchange'])->default('cash');
                $table->enum('reason', ['defective', 'wrong_item', 'not_satisfied', 'other'])->default('other');
            }

            $table->text('notes')->nullable();
            $table->dateTime('return_date');
            $table->timestamps();

            $table->index('sale_id');
            $table->index('sale_item_id');
            $table->index('return_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};
