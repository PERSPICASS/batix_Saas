<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Facture Normalisée Électronique (Côte d'Ivoire).
 *
 * Chaque boutique est un couple établissement / point de vente FNE et porte la clé API
 * de SON entreprise : BatixPro n'est pas le contribuable, la DGI délivre une clé par
 * entreprise après validation de ses spécimens.
 *
 * Factures et avoirs gardent la trace de leur certification. `fne_invoice_id` et
 * `invoice_items.fne_item_id` sont indispensables : l'avoir FNE se fait sur l'identifiant
 * DGI de la facture et de chaque ligne, pas sur les nôtres.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->boolean('fne_enabled')->default(false);
            $table->string('fne_environment', 10)->default('test');
            $table->text('fne_api_key')->nullable();
            $table->string('fne_base_url')->nullable();
            $table->string('fne_establishment')->nullable();
            $table->string('fne_point_of_sale')->nullable();
            $table->string('fne_zero_rate_code', 4)->default('TVAD');
            $table->integer('fne_balance_sticker')->nullable();
            $table->boolean('fne_sticker_warning')->default(false);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('ncc', 30)->nullable();
            $table->string('fne_template', 3)->default('B2C');
        });

        foreach (['invoices', 'credit_notes'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->string('fne_status', 12)->nullable()->index();
                $table->string('fne_reference')->nullable();
                $table->string('fne_verification_url')->nullable();
                $table->string('fne_invoice_id')->nullable();
                $table->timestamp('fne_certified_at')->nullable();
                $table->text('fne_error')->nullable();
                $table->unsignedSmallInteger('fne_attempts')->default(0);
                $table->json('fne_response')->nullable();
            });
        }

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('fne_item_id')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', fn (Blueprint $table) => $table->dropColumn('fne_item_id'));

        foreach (['invoices', 'credit_notes'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropIndex(["fne_status"]);
                $table->dropColumn([
                    'fne_status', 'fne_reference', 'fne_verification_url', 'fne_invoice_id',
                    'fne_certified_at', 'fne_error', 'fne_attempts', 'fne_response',
                ]);
            });
        }

        Schema::table('customers', fn (Blueprint $table) => $table->dropColumn(['ncc', 'fne_template']));

        Schema::table('shops', fn (Blueprint $table) => $table->dropColumn([
            'fne_enabled', 'fne_environment', 'fne_api_key', 'fne_base_url', 'fne_establishment',
            'fne_point_of_sale', 'fne_zero_rate_code', 'fne_balance_sticker', 'fne_sticker_warning',
        ]));
    }
};
