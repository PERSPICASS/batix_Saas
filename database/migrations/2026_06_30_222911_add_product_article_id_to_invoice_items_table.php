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
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->foreignId('product_article_id')->nullable()->constrained('product_articles')->onDelete('set null');
            $table->string('article_name')->nullable(); // Nom de l'article saisi manuellement
        });

        Schema::table('quote_items', function (Blueprint $table) {
            $table->foreignId('product_article_id')->nullable()->constrained('product_articles')->onDelete('set null');
            $table->string('article_name')->nullable(); // Nom de l'article saisi manuellement
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['product_article_id']);
            $table->dropColumn(['product_article_id', 'article_name']);
        });

        Schema::table('quote_items', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['product_article_id']);
            $table->dropColumn(['product_article_id', 'article_name']);
        });
    }
};
