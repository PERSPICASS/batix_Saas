<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Sale;
use App\Support\GlobalDiscount;
use Illuminate\Console\Command;

/**
 * Chiffre la TVA surévaluée sur les documents remisés émis avant le correctif.
 *
 * Une remise accordée sur l'ensemble d'un document réduit la base imposable. Jusqu'au
 * correctif, elle était retranchée du total TTC — donc APRÈS la taxe : le total baissait
 * bien du montant remisé, mais la TVA restait calculée sur la base non remisée. Toute
 * déclaration appuyée sur ces documents surévalue la taxe collectée.
 *
 * La commande ne modifie RIEN. Elle recalcule ce que chaque document devrait porter et
 * compare : un document déjà correct — émis après le correctif — ressort à zéro et n'est
 * pas compté. Aucune date n'est donc à connaître.
 *
 * Les montants sont groupés par devise : additionner des XOF et des MAD ne voudrait rien
 * dire.
 */
class AuditDiscountTax extends Command
{
    protected $signature = 'tax:audit-discounts
        {--shop= : Limiter à une boutique}';

    protected $description = "Chiffre la TVA surévaluée sur les documents portant une remise globale.";

    /** Au-delà, on résume : la liste devient illisible et le total suffit à décider. */
    private const MAX_ROWS_SHOWN = 20;

    public function handle(): int
    {
        $rows = array_merge($this->auditInvoices(), $this->auditSales());

        if (empty($rows)) {
            $this->info('Aucun document remisé ne porte de TVA surévaluée.');

            return self::SUCCESS;
        }

        $shown = collect($rows)->sortByDesc('overstated')->take(self::MAX_ROWS_SHOWN);

        $this->table(
            ['Type', 'Numéro', 'Boutique', 'Remise', 'TVA portée', 'TVA due', 'Écart'],
            $shown->map(fn ($r) => [
                $r['type'],
                $r['number'],
                $r['shop'],
                number_format($r['discount'], 2, ',', ' '),
                number_format($r['stored'], 2, ',', ' '),
                number_format($r['correct'], 2, ',', ' '),
                number_format($r['overstated'], 2, ',', ' ') . ' ' . $r['currency'],
            ])->all()
        );

        if (count($rows) > self::MAX_ROWS_SHOWN) {
            $this->line('… et ' . (count($rows) - self::MAX_ROWS_SHOWN) . ' autre(s) document(s).');
        }

        $this->newLine();
        $this->line('<comment>Total par devise</comment>');

        foreach (collect($rows)->groupBy('currency') as $currency => $group) {
            $this->line(sprintf(
                '  %s : %s document(s), %s de TVA surévaluée',
                $currency,
                $group->count(),
                number_format($group->sum('overstated'), 2, ',', ' ')
            ));
        }

        $this->newLine();
        $this->warn('Aucun document n\'a été modifié.');
        $this->line('Ces pièces sont émises : leur contenu est figé, et le corriger');
        $this->line('supposerait un avoir, pas une réécriture.');

        return self::SUCCESS;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function auditInvoices(): array
    {
        $rows = [];

        Invoice::query()
            ->where('discount_amount', '>', 0)
            ->when($this->option('shop'), fn ($q, $shop) => $q->where('shop_id', $shop))
            ->with(['items:id,invoice_id,total,tax_amount', 'shop:id,name,currency'])
            ->chunkById(200, function ($invoices) use (&$rows) {
                foreach ($invoices as $invoice) {
                    $row = $this->compare(
                        $invoice->items,
                        (float) $invoice->discount_amount,
                        (float) $invoice->tax_amount
                    );

                    if ($row) {
                        $rows[] = $row + [
                            'type' => 'Facture',
                            'number' => $invoice->invoice_number,
                            'shop' => $invoice->shop?->name ?? '—',
                            'currency' => $invoice->shop?->currency ?? '',
                        ];
                    }
                }
            });

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function auditSales(): array
    {
        $rows = [];

        Sale::query()
            ->where('discount_amount', '>', 0)
            ->when($this->option('shop'), fn ($q, $shop) => $q->where('shop_id', $shop))
            ->with(['items:id,sale_id,total,tax_amount', 'shop:id,name,currency'])
            ->chunkById(200, function ($sales) use (&$rows) {
                foreach ($sales as $sale) {
                    $row = $this->compare(
                        $sale->items,
                        (float) $sale->discount_amount,
                        (float) $sale->tax_amount
                    );

                    if ($row) {
                        $rows[] = $row + [
                            'type' => 'Vente',
                            'number' => $sale->ticket_number,
                            'shop' => $sale->shop?->name ?? '—',
                            'currency' => $sale->shop?->currency ?? '',
                        ];
                    }
                }
            });

        return $rows;
    }

    /**
     * Ce que le document porte face à ce qu'il devrait porter.
     *
     * Null quand les deux coïncident, à un centime près : un document émis après le
     * correctif est déjà juste, et l'arrondi ne doit pas le faire ressortir.
     *
     * @return array<string, mixed>|null
     */
    private function compare($items, float $discount, float $stored): ?array
    {
        $base = (float) $items->sum(fn ($item) => (float) $item->total - (float) $item->tax_amount);
        $gross = (float) $items->sum(fn ($item) => (float) $item->tax_amount);

        if ($base <= 0) {
            return null;
        }

        $correct = round($gross * GlobalDiscount::ratio($base, $discount), 2);
        $overstated = round($stored - $correct, 2);

        if ($overstated <= 0.01) {
            return null;
        }

        return [
            'discount' => $discount,
            'stored' => $stored,
            'correct' => $correct,
            'overstated' => $overstated,
        ];
    }
}
