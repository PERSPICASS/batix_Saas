<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * L'échange d'un article et l'avoir client.
 *
 * - `sales.exchanged_sale_id` : la vente de remplacement pointe la vente d'origine ;
 *   `returns.replacement_sale_id` dit, côté retour, ce qu'il est devenu.
 * - `sales.exchange_credit` / `store_credit_used` / `store_credit_kept` : ce qui a payé la
 *   vente sans être de l'argent remis ce jour-là, et ce qui a été gardé en avoir.
 * - `customer_credits` : l'avoir client est un registre de mouvements, jamais un compteur —
 *   un solde sans histoire ne se vérifie pas (cf. stock:audit et ses 4 089 écarts).
 *
 * Clés en cascade / nullOnDelete : une suppression de compte passe par le cascade des
 * boutiques, une clé RESTRICT la bloquerait (cf. AccountDeletion).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('exchanged_sale_id')->nullable()->after('customer_id')->constrained('sales')->nullOnDelete();
            $table->decimal('exchange_credit', 12, 2)->default(0)->after('amount_paid');
            $table->decimal('store_credit_used', 12, 2)->default(0)->after('exchange_credit');
            $table->decimal('store_credit_kept', 12, 2)->default(0)->after('store_credit_used');
        });

        Schema::table('returns', function (Blueprint $table) {
            $table->foreignId('replacement_sale_id')->nullable()->after('sale_item_id')->constrained('sales')->nullOnDelete();
        });

        Schema::create('customer_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sale_return_id')->nullable()->constrained('returns')->nullOnDelete();
            // Positif : avoir accordé. Négatif : avoir dépensé.
            $table->decimal('amount', 12, 2);
            $table->string('type', 30);
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_credits');

        Schema::table('returns', function (Blueprint $table) {
            $table->dropConstrainedForeignId('replacement_sale_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('exchanged_sale_id');
            $table->dropColumn(['exchange_credit', 'store_credit_used', 'store_credit_kept']);
        });
    }
};
