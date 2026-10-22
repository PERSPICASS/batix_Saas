<?php

namespace App\Console\Commands;

use App\Models\Sale;
use Illuminate\Console\Command;

/**
 * Retrouve les ventes dont la remise a été rognée à l'enregistrement.
 *
 * Entre f45033f (2026-10-19) et son correctif, Sale::calculateTotals() bornait la remise
 * au sous-total de la vente pendant que ses lignes étaient encore créées une à une, puis
 * l'enregistrait. Dès qu'une remise dépassait le HT de la première ligne, elle était
 * ramenée à ce HT, et le total stocké était trop élevé. Le reste dû et le statut, eux,
 * venaient de SaleCreationService et sont justes.
 *
 * Signature : au moins deux lignes, et une remise égale au HT de la première. Une remise
 * qui tombe pile sur ce montant ressort aussi : c'est une liste à vérifier, pas une preuve.
 *
 * La commande ne modifie RIEN.
 */
class AuditCappedSaleDiscounts extends Command
{
    protected $signature = 'sales:audit-capped-discounts
        {--since=2026-10-19 : Ventes créées à partir de cette date}
        {--shop= : Limiter à une boutique}';

    protected $description = 'Liste les ventes dont la remise globale a été rognée au HT de la première ligne.';

    public function handle(): int
    {
        $rows = [];

        Sale::query()
            ->where('discount_amount', '>', 0)
            ->where('created_at', '>=', $this->option('since'))
            ->when($this->option('shop'), fn ($q, $shop) => $q->where('shop_id', $shop))
            ->with(['items' => fn ($q) => $q->orderBy('id'), 'shop:id,name,currency'])
            ->chunkById(200, function ($sales) use (&$rows) {
                foreach ($sales as $sale) {
                    if ($row = $this->inspect($sale)) {
                        $rows[] = $row;
                    }
                }
            });

        if (empty($rows)) {
            $this->info('Aucune vente ne porte de remise rognée.');

            return self::SUCCESS;
        }

        $this->table(
            ['Ticket', 'Boutique', 'Date', 'Remise portée', 'Remise d\'origine', 'Total porté', 'Total dû'],
            array_map(fn ($r) => [
                $r['number'],
                $r['shop'],
                $r['date'],
                $this->money($r['stored_discount']),
                ($r['exact'] ? '' : '≥ ') . $this->money($r['discount']),
                $this->money($r['stored_total']),
                ($r['exact'] ? '' : '≤ ') . $this->money($r['total']) . ' ' . $r['currency'],
            ], $rows)
        );

        $this->newLine();
        $this->line(count($rows) . ' vente(s) suspecte(s).');
        $this->line('« ≥ / ≤ » : vente payée comptant, le montant encaissé ne donne qu\'une borne');
        $this->line('(la monnaie rendue n\'est plus connue). Les autres sont exactes.');
        $this->warn('Aucune vente n\'a été modifiée.');

        return self::SUCCESS;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function inspect(Sale $sale): ?array
    {
        if ($sale->items->count() < 2) {
            return null;
        }

        $first = $sale->items->first();
        $firstHt = round((float) $first->total - (float) $first->tax_amount, 2);

        if (abs($firstHt - (float) $sale->discount_amount) > 0.01) {
            return null;
        }

        $base = (float) $sale->items->sum(fn ($item) => (float) $item->total - (float) $item->tax_amount);
        $grossTax = (float) $sale->items->sum(fn ($item) => (float) $item->tax_amount);

        // Le service a calculé le reste dû sur le vrai total : payé + reste dû le redonne,
        // exactement tant qu'un solde existe, sinon comme plafond (monnaie rendue inconnue).
        $exact = (float) $sale->remaining_amount > 0;
        $total = round((float) $sale->amount_paid + (float) $sale->remaining_amount, 2);

        if ($total >= (float) $sale->total - 0.01) {
            return null;
        }

        // total = (base − remise) × (1 + taxe brute / base), la taxe suivant la base remisée.
        $discount = round($base - $total * $base / ($base + $grossTax), 2);

        return [
            'number' => $sale->ticket_number,
            'shop' => $sale->shop?->name ?? '—',
            'currency' => $sale->shop?->currency ?? '',
            'date' => $sale->created_at?->format('d/m/Y'),
            'stored_discount' => (float) $sale->discount_amount,
            'discount' => $discount,
            'stored_total' => (float) $sale->total,
            'total' => $total,
            'exact' => $exact,
        ];
    }

    private function money(float $amount): string
    {
        return number_format($amount, 2, ',', ' ');
    }
}
