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

        Schema::create('sales', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Caissier/Vendeur
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null'); // Client optionnel
            $table->string('ticket_number')->unique(); // Numéro de ticket
            $table->dateTime('sale_date'); // Date/heure de la vente

            if ($driver === 'sqlite') {
                $table->text('payment_method')->default('cash');
                $table->text('status')->default('completed');
            } else {
                $table->enum('payment_method', ['cash', 'card', 'transfer', 'check', 'mobile', 'multiple'])->default('cash');
                $table->enum('status', ['completed', 'pending', 'cancelled', 'returned'])->default('completed');
            }

            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0); // Montant payé
            $table->decimal('change_amount', 15, 2)->default(0); // Monnaie rendue
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('shop_id');
            $table->index('user_id');
            $table->index('customer_id');
            $table->index('ticket_number');
            $table->index('sale_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
