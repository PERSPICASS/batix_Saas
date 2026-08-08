<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        // Un produit Chariow par couple (plan, cycle) : les prix mensuel et annuel
        // sont deux produits distincts côté Chariow, comme les deux paddle_price_id.
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->string('chariow_product_id')->nullable()->after('paddle_price_id_yearly');
            $table->string('chariow_product_id_yearly')->nullable()->after('chariow_product_id');
        });

        Schema::create('chariow_checkouts', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->string('reference')->unique(); // envoyé dans custom_metadata, sert de clé de retour
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->onDelete('cascade');

            if ($driver === 'sqlite') {
                $table->text('billing_cycle');
                $table->text('status')->default('pending');
            } else {
                $table->enum('billing_cycle', ['monthly', 'yearly']);
                $table->enum('status', ['pending', 'completed', 'failed', 'abandoned'])->default('pending');
            }

            $table->string('sale_id')->nullable()->index();        // sal_xxx
            $table->string('transaction_id')->nullable();          // txn_xxx
            $table->string('chariow_product_id');
            $table->decimal('amount', 10, 2);                      // montant attendu, calculé côté Batix
            $table->string('currency', 3)->default('XOF');
            $table->boolean('subscription_activated')->default(false);
            $table->text('checkout_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
        });

        // Déduplication des webhooks : Chariow demande explicitement de dédupliquer sur
        // x-pulse-delivery-id, stable à travers les retries, et non sur l'id de l'entité
        // (un même événement peut donner lieu à plusieurs livraisons).
        Schema::create('chariow_pulse_deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_id')->unique();
            $table->string('event')->nullable();
            $table->timestamp('processed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chariow_pulse_deliveries');
        Schema::dropIfExists('chariow_checkouts');

        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['chariow_product_id', 'chariow_product_id_yearly']);
        });
    }
};
