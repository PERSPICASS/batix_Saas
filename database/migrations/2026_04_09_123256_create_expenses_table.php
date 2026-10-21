<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->decimal('amount', 15, 2);
            $table->string('category')->default('Autre');
            $table->date('expense_date');
            $table->string('payment_method')->nullable(); // cash, card, transfer, check, mobile
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->string('receipt')->nullable(); // chemin fichier justificatif
            $table->timestamps();

            $table->index('shop_id');
            $table->index('expense_date');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
