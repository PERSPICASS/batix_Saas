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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            
            // Qui a fait l'action
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('user_name')->nullable(); // Nom de l'utilisateur au moment de l'action
            $table->string('user_email')->nullable();
            $table->string('user_role')->nullable();
            
            // Dans quel contexte (compte/boutique)
            $table->foreignId('shop_id')->nullable()->constrained()->onDelete('set null');
            $table->string('shop_name')->nullable();
            $table->string('account_code')->nullable(); // code_user du compte
            
            // Quoi (action)
            $table->string('action'); // create, update, delete, view, export, etc.
            $table->string('description')->nullable(); // Description lisible
            
            // Sur quoi (ressource)
            $table->string('subject_type')->nullable(); // Model class name
            $table->unsignedBigInteger('subject_id')->nullable(); // Model ID
            $table->json('properties')->nullable(); // Old & new values, metadata
            
            // Informations techniques
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('method')->nullable(); // GET, POST, PUT, DELETE
            $table->text('url')->nullable();
            
            $table->timestamps();
            
            // Index pour recherches rapides
            $table->index(['user_id', 'created_at']);
            $table->index(['shop_id', 'created_at']);
            $table->index(['subject_type', 'subject_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
