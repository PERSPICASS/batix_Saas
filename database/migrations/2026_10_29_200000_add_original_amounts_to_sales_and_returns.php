<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use App\Support\CounterSales;
use Illuminate\Support\Facades\Schema;

/**
 * Le CA daté comme la comptabilité : une vente compte pour son montant d'origine au jour
 * de la vente, un retour en négatif au jour du retour (cf. CounterSales).
 *
 * Un retour réécrit le total de la vente (SaleReturnService) : sans le montant d'origine,
 * un article rendu en novembre faisait baisser le CA d'octobre, un mois déjà clos.
 *
 * - `sales.original_total` (TTC) / `original_net` (HT, remise déduite) : posés à la création.
 * - `returns.net_amount` : la baisse HT du retour, le pendant de `refund_amount` (TTC).
 *
 * Reconstitution de l'existant : le total actuel plus ce que les retours en ont retiré, et
 * côté HT, les lignes (jamais modifiées) moins la remise d'origine. `sales:audit-revenue`
 * vérifie ensuite, vente par vente, que l'ensemble retombe sur les tickets.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('original_total', 12, 2)->nullable()->after('total');
            $table->decimal('original_net', 12, 2)->nullable()->after('original_total');
        });

        Schema::table('returns', function (Blueprint $table) {
            $table->decimal('net_amount', 12, 2)->nullable()->after('refund_amount');
        });

        CounterSales::backfill();
    }

    public function down(): void
    {
        Schema::table('returns', fn (Blueprint $table) => $table->dropColumn('net_amount'));
        Schema::table('sales', fn (Blueprint $table) => $table->dropColumn(['original_total', 'original_net']));
    }
};
