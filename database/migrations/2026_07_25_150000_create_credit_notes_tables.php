<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * L'avoir : le seul moyen de corriger une facture émise.
 *
 * Depuis que le contenu d'une facture est figé dès l'émission, une facture erronée ou
 * payée ne peut plus être retouchée. L'avoir est le document qui la corrige — sans jamais
 * la modifier : la facture reste ce qu'elle était, l'avoir vient s'y opposer. C'est
 * exactement ainsi que la correction doit être tracée, et c'est pourquoi rien ici ne
 * réécrit `invoices`.
 *
 * Un avoir porte des lignes rattachées aux lignes de la facture, donc les corrections
 * partielles sont natives : rendre 2 sacs sur 10 est un avoir de 2 sacs, pas une
 * annulation de la facture entière.
 *
 * Pas de deleted_at : un avoir est lui-même une pièce, il ne s'annule pas plus qu'une
 * facture. Aucun chemin de suppression n'existe côté contrôleur.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained();
            $table->foreignId('user_id')->constrained();

            // Unique par boutique, comme les factures et les devis depuis 4f63f0f : une
            // contrainte globale ferait échouer le premier avoir d'une seconde boutique.
            $table->string('credit_note_number');
            $table->date('credit_note_date');
            $table->string('reason');
            $table->text('notes')->nullable();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->timestamps();

            $table->unique(['shop_id', 'credit_note_number']);
            $table->index('invoice_id');
        });

        Schema::create('credit_note_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_note_id')->constrained()->cascadeOnDelete();

            // La ligne de facture créditée. C'est elle qui borne la quantité : on ne peut
            // pas créditer plus qu'il n'a été facturé, cumul des avoirs précédents inclus.
            $table->foreignId('invoice_item_id')->constrained();

            $table->string('product_name');
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('total', 12, 2);

            $table->timestamps();

            $table->index('invoice_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_note_items');
        Schema::dropIfExists('credit_notes');
    }
};
