<?php

use App\Support\Unit;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Quantités décimales : 1,5 m de ruban, 2,5 kg de ciment.
     *
     * Toute la chaîne passe en numeric(12,3) d'un coup — ventes, documents, achats, stock,
     * dépôts, transferts, inventaires. Laisser un seul maillon en entier tronquerait le
     * stock en silence (vendre 2,5 kg, en retirer 2). Les CHECK `>= 0` de products et
     * depot_products restent valides sur le nouveau type.
     *
     * Les unités saisies en texte libre (« Pièce », « Kg », « M² ») sont ramenées à leur
     * code : c'est lui qui décide si un produit accepte une quantité décimale.
     */
    private const COLUMNS = [
        'products' => [
            'stock_quantity' => ['default' => 0],
            'defective_stock_quantity' => ['default' => 0],
            'min_stock_alert' => ['nullable' => true],
        ],
        'sale_items' => ['quantity' => ['default' => 1]],
        'invoice_items' => ['quantity' => ['default' => 1]],
        'quote_items' => ['quantity' => []],
        'recurring_invoice_items' => ['quantity' => ['default' => 1]],
        'credit_note_items' => ['quantity' => []],
        'returns' => ['quantity_returned' => []],
        'returned_inventories' => ['quantity' => []],
        'stock_movements' => ['quantity' => ['comment' => 'Positive for in, negative for out']],
        'inventory_items' => [
            'expected_quantity' => ['comment' => 'Quantity in system before count'],
            'counted_quantity' => ['nullable' => true, 'comment' => 'Actual counted quantity'],
            'difference' => ['default' => 0, 'comment' => 'counted - expected'],
            'defective_quantity' => ['nullable' => true],
            'expected_defective_quantity' => ['default' => 0],
            'defective_difference' => ['default' => 0],
        ],
        'purchase_items' => [
            'quantity_ordered' => [],
            'quantity_received' => ['default' => 0],
        ],
        'depot_products' => [
            'quantity' => ['default' => 0],
            'min_stock_alert' => ['default' => 0],
        ],
        'depot_transfers' => ['quantity' => []],
        'stock_transfer_items' => ['quantity' => []],
        'preorders' => ['quantity_ordered' => []],
    ];

    public function up(): void
    {
        $this->convert(fn (Blueprint $table, string $column) => $table->decimal($column, 12, Unit::PRECISION));

        DB::table('products')->select('id', 'unit')->orderBy('id')->chunkById(500, function ($products) {
            foreach ($products as $product) {
                $code = Unit::normalize($product->unit);

                if ($code !== $product->unit) {
                    DB::table('products')->where('id', $product->id)->update(['unit' => $code]);
                }
            }
        });

        Schema::table('products', fn (Blueprint $table) => $table->string('unit')->default('piece')->change());
    }

    public function down(): void
    {
        $this->convert(fn (Blueprint $table, string $column) => $table->integer($column));
    }

    private function convert(callable $define): void
    {
        foreach (self::COLUMNS as $tableName => $columns) {
            Schema::table($tableName, function (Blueprint $table) use ($columns, $define) {
                foreach ($columns as $column => $options) {
                    $definition = $define($table, $column);

                    if ($options['nullable'] ?? false) {
                        $definition->nullable();
                    }

                    if (array_key_exists('default', $options)) {
                        $definition->default($options['default']);
                    }

                    // change() réécrit toute la colonne : un commentaire non répété est effacé.
                    if (isset($options['comment'])) {
                        $definition->comment($options['comment']);
                    }

                    $definition->change();
                }
            });
        }
    }
};
