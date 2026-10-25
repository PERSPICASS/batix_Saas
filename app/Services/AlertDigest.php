<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockTransfer;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Ce qui mérite l'attention d'un propriétaire ce matin, boutique par boutique.
 *
 * - une baisse du CA : les 7 derniers jours en dessous de 70 % des 7 jours d'avant
 *   (définitions de ShopsOverview) ;
 * - les retards de paiement : ventes à crédit et factures envoyées dont l'échéance est
 *   passée ;
 * - le stock : produits en rupture, produits sous leur seuil d'alerte ;
 * - les transferts de stock en route depuis plus de 3 jours.
 *
 * Vide quand il n'y a rien à dire : on n'envoie pas un email pour dire que tout va bien.
 */
class AlertDigest
{
    /** Une baisse se signale à partir de -30 %. */
    public const DROP = 0.30;

    /** Un transfert est « en retard » au-delà de 3 jours en transit. */
    public const STALE_TRANSFER_DAYS = 3;

    public function __construct(private ShopsOverview $overview) {}

    /**
     * @return array{shops: array<int, array<string, mixed>>, transfers: array<int, array<string, mixed>>}|null
     */
    public function for(User $owner): ?array
    {
        $shops = $owner->accessibleShopsQuery()->where('is_active', true)->orderBy('name')->get(['shops.id', 'shops.name', 'shops.currency']);
        if ($shops->isEmpty()) {
            return null;
        }
        $ids = $shops->pluck('id')->all();

        $today = now()->startOfDay();
        $recent = $this->overview->figures($shops, $today->copy()->subDays(7), $today->copy()->subSecond(), withSnapshot: false);
        $before = $this->overview->figures($shops, $today->copy()->subDays(14), $today->copy()->subDays(7)->subSecond(), withSnapshot: false);

        $overdueSales = Sale::whereIn('shop_id', $ids)->where('status', 'pending')
            ->whereNotNull('credit_due_date')->whereDate('credit_due_date', '<', $today->toDateString())
            ->groupBy('shop_id')->selectRaw('shop_id, COUNT(*) AS n, SUM(remaining_amount) AS owed')->get()->keyBy('shop_id');
        $overdueInvoices = Invoice::whereIn('shop_id', $ids)->where('status', 'sent')
            ->whereNotNull('due_date')->whereDate('due_date', '<', $today->toDateString())
            ->groupBy('shop_id')->selectRaw('shop_id, COUNT(*) AS n, SUM(total) AS owed')->get()->keyBy('shop_id');

        $stock = Product::whereIn('shop_id', $ids)->whereNull('parent_id')->where('is_active', true)->where('track_stock', true)
            ->groupBy('shop_id')
            ->selectRaw('shop_id,
                SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) AS out_of_stock,
                SUM(CASE WHEN stock_quantity > 0 AND min_stock_alert IS NOT NULL AND stock_quantity <= min_stock_alert THEN 1 ELSE 0 END) AS low')
            ->get()->keyBy('shop_id');

        $lines = [];
        foreach ($shops as $shop) {
            $now = $recent[$shop->id]['revenue'];
            $then = $before[$shop->id]['revenue'];
            $alerts = [];

            if ($then > 0 && $now < $then * (1 - self::DROP)) {
                $alerts['revenue_drop'] = ['recent' => $now, 'before' => $then, 'change' => (int) round(($now - $then) / $then * 100)];
            }

            $sales = $overdueSales->get($shop->id);
            $invoices = $overdueInvoices->get($shop->id);
            if ($sales || $invoices) {
                $alerts['overdue'] = [
                    'count' => (int) ($sales->n ?? 0) + (int) ($invoices->n ?? 0),
                    'owed' => round((float) ($sales->owed ?? 0) + (float) ($invoices->owed ?? 0), 2),
                ];
            }

            $row = $stock->get($shop->id);
            if ($row && ((int) $row->out_of_stock > 0 || (int) $row->low > 0)) {
                $alerts['stock'] = ['out_of_stock' => (int) $row->out_of_stock, 'low' => (int) $row->low];
            }

            if ($alerts !== []) {
                $lines[] = ['id' => $shop->id, 'name' => $shop->name, 'currency' => $shop->currency, 'alerts' => $alerts];
            }
        }

        $transfers = StockTransfer::with(['fromShop:id,name', 'toShop:id,name'])
            ->where('status', 'in_transit')
            ->where('sent_at', '<', now()->subDays(self::STALE_TRANSFER_DAYS))
            ->where(fn ($q) => $q->whereIn('from_shop_id', $ids)->orWhereIn('to_shop_id', $ids))
            ->orderBy('sent_at')
            ->get()
            ->map(fn ($t) => [
                'reference' => $t->reference,
                'from' => $t->fromShop?->name,
                'to' => $t->toShop?->name,
                'days' => (int) $t->sent_at->startOfDay()->diffInDays(now()->startOfDay()),
            ])->all();

        if ($lines === [] && $transfers === []) {
            return null;
        }

        return ['shops' => $lines, 'transfers' => $transfers];
    }
}
