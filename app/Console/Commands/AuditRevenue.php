<?php

namespace App\Console\Commands;

use App\Models\Shop;
use App\Support\CounterSales;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Le contrôle du CA au comptoir daté comme la comptabilité (CounterSales). Lecture seule.
 *
 * 1. Vente par vente : le montant d'origine moins ses retours doit retomber sur le ticket
 *    actuel, TTC et HT. Un écart veut dire que ventes et retours ne s'additionnent pas — le
 *    CA par période serait faux de cet écart.
 * 2. Mois par mois : ce que le nouveau calcul change par rapport à l'ancien, où un retour
 *    réécrivait le mois de la vente. Sur toute la durée, la somme des écarts est nulle : le
 *    CA ne fait que changer de mois.
 */
class AuditRevenue extends Command
{
    protected $signature = 'sales:audit-revenue
        {--shop= : Limiter à une boutique}
        {--months=12 : Nombre de mois comparés}';

    protected $description = 'Vérifie que ventes et retours retombent sur les tickets, et montre ce que le CA daté change par mois.';

    public function handle(): int
    {
        $shopIds = $this->option('shop') ? [(int) $this->option('shop')] : Shop::pluck('id')->all();

        $ok = $this->checkSales($shopIds);
        $this->newLine();
        $this->compareMonths($shopIds, max(1, (int) $this->option('months')));

        return $ok ? self::SUCCESS : self::FAILURE;
    }

    private function checkSales(array $shopIds): bool
    {
        $returns = DB::table('returns')->groupBy('sale_id')
            ->selectRaw('sale_id, SUM(refund_amount) AS refunded, SUM(COALESCE(net_amount, 0)) AS net_refunded');

        $gaps = DB::table('sales')
            ->leftJoinSub($returns, 'r', 'r.sale_id', '=', 'sales.id')
            ->whereIn('sales.shop_id', $shopIds)
            ->where('sales.status', '!=', 'cancelled')
            ->selectRaw('sales.shop_id, sales.ticket_number, sales.original_total, sales.total, COALESCE(r.refunded, 0) AS refunded,
                sales.original_net, (sales.subtotal - sales.discount_amount) AS net, COALESCE(r.net_refunded, 0) AS net_refunded')
            ->get()
            ->filter(fn ($s) => abs((float) $s->original_total - (float) $s->refunded - (float) $s->total) > 0.01
                || abs((float) $s->original_net - (float) $s->net_refunded - (float) $s->net) > 0.01);

        if ($gaps->isEmpty()) {
            $this->info('Chaque vente retombe sur son ticket : montant d\'origine - retours = total actuel (TTC et HT).');

            return true;
        }

        $this->error($gaps->count() . ' vente(s) dont les retours ne retombent pas sur le ticket :');
        $this->table(
            ['Boutique', 'Ticket', 'Origine TTC', 'Retours TTC', 'Ticket TTC', 'Écart TTC', 'Écart HT'],
            $gaps->take(50)->map(fn ($s) => [
                $s->shop_id, $s->ticket_number, $s->original_total, $s->refunded, $s->total,
                round((float) $s->original_total - (float) $s->refunded - (float) $s->total, 2),
                round((float) $s->original_net - (float) $s->net_refunded - (float) $s->net, 2),
            ])->all()
        );

        return false;
    }

    private function compareMonths(array $shopIds, int $months): void
    {
        $start = now()->subMonths($months - 1)->startOfMonth();
        $end = now()->endOfDay();
        $month = fn (string $column) => DB::connection()->getDriverName() === 'pgsql'
            ? "TO_CHAR({$column}, 'YYYY-MM')" : "strftime('%Y-%m', {$column})";

        // L'ancien calcul : le total actuel des tickets au mois de la vente, ventes
        // entièrement retournées écartées.
        $old = DB::table('sales')->whereIn('shop_id', $shopIds)->whereNotIn('status', ['cancelled', 'returned'])
            ->whereBetween('sale_date', [$start, $end])
            ->groupByRaw($month('sale_date'))->selectRaw($month('sale_date') . ' AS m, SUM(total) AS revenue')
            ->pluck('revenue', 'm');

        $sold = CounterSales::sales($shopIds, $start, $end)
            ->groupByRaw($month('sales.sale_date'))->selectRaw($month('sales.sale_date') . ' AS m, SUM(sales.original_total) AS revenue')
            ->pluck('revenue', 'm');
        $returned = CounterSales::returns($shopIds, $start, $end)
            ->groupByRaw($month('returns.return_date'))->selectRaw($month('returns.return_date') . ' AS m, SUM(returns.refund_amount) AS revenue')
            ->pluck('revenue', 'm');

        $rows = [];
        for ($m = $start->copy(); $m <= $end; $m->addMonth()) {
            $key = $m->format('Y-m');
            $before = round((float) ($old[$key] ?? 0), 2);
            $after = round((float) ($sold[$key] ?? 0) - (float) ($returned[$key] ?? 0), 2);
            if (abs($after - $before) > 0.01) {
                $rows[] = [$key, number_format($before, 0, ',', ' '), number_format($after, 0, ',', ' '), ($after > $before ? '+' : '') . number_format($after - $before, 0, ',', ' ')];
            }
        }

        if ($rows === []) {
            $this->info("CA au comptoir : aucun mois ne change sur les {$months} derniers mois.");

            return;
        }

        $this->warn('CA au comptoir (TTC) : les mois qui changent avec le calcul daté.');
        $this->table(['Mois', 'Ancien calcul', 'Nouveau calcul', 'Écart'], $rows);
        $this->line("Un retour compte désormais au mois du retour, et non plus à celui de la vente. Un écart se reporte d'un mois sur l'autre.");
    }
}
