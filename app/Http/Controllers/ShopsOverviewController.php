<?php

namespace App\Http\Controllers;

use App\Exports\ShopsOverviewExport;
use App\Models\Shop;
use App\Services\ShopReport;
use App\Services\ShopsOverview;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * « Mes boutiques » : toutes les boutiques du compte côte à côte, avec leurs chiffres.
 *
 * Réservée au propriétaire du compte, comme le sélecteur de boutique de l'en-tête : un
 * gérant ou un caissier ne voit que sa boutique, une comparaison n'aurait pas de sens.
 */
class ShopsOverviewController extends Controller
{
    private const PERIODS = ['today', 'week', 'month', 'year', 'custom'];

    public function index(Request $request, ShopsOverview $overview): Response
    {
        return Inertia::render('Shops/Overview', $this->data($request, $overview) + [
            'filters' => (object) $request->only(['period', 'date_from', 'date_to']),
        ]);
    }

    /** Le même tableau, en Excel : mêmes boutiques, même période, mêmes chiffres. */
    public function export(Request $request, ShopsOverview $overview): BinaryFileResponse
    {
        $data = $this->data($request, $overview);

        return Excel::download(
            new ShopsOverviewExport($data['rows'], $data['totals'], $data['period']),
            "mes-boutiques_{$data['period']['start']}_{$data['period']['end']}.xlsx"
        );
    }

    /**
     * Le détail d'une boutique : ses indicateurs, l'évolution de son CA, ce qui le compose,
     * et ce qui demande une action. Même période et mêmes définitions que la liste.
     */
    public function show(Request $request, string $codeUser, Shop $shop, ShopReport $report): Response
    {
        $user = Auth::user();
        abort_unless($user->role === 'super_admin', 403);
        // Une boutique d'un autre compte n'existe pas, vue d'ici.
        abort_unless($user->accessibleShopsQuery()->whereKey($shop->id)->exists(), 404);

        $period = $this->period($request);

        return Inertia::render('Shops/OverviewShow', [
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'currency' => $shop->currency,
                'currency_symbol' => get_currency_symbol($shop->currency),
                'is_active' => (bool) $shop->is_active,
            ],
            'report' => $report->build($shop, ...array_values(array_slice($period, 1))),
            'period' => $this->periodProps($period),
            'filters' => (object) $request->only(['period', 'date_from', 'date_to']),
        ]);
    }

    /**
     * La période demandée et celle à laquelle on la compare.
     *
     * @return array{key: string, start: CarbonInterface, end: CarbonInterface, previous_start: CarbonInterface, previous_end: CarbonInterface}
     */
    private function period(Request $request): array
    {
        $validated = $request->validate([
            'period' => ['nullable', 'in:'.implode(',', self::PERIODS)],
            'date_from' => ['nullable', 'date', 'required_if:period,custom'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from', 'required_if:period,custom'],
        ]);
        $key = $validated['period'] ?? 'month';

        [$start, $end] = $this->range($key, $validated);
        [$previousStart, $previousEnd] = $this->previousRange($key, $start, $end);

        return ['key' => $key, 'start' => $start, 'end' => $end, 'previous_start' => $previousStart, 'previous_end' => $previousEnd];
    }

    private function periodProps(array $period): array
    {
        return ['key' => $period['key']] + array_map(fn ($date) => $date->toDateString(), array_slice($period, 1));
    }

    /**
     * Les lignes, les totaux par devise et la période : partagé par l'écran et l'export,
     * pour qu'ils ne puissent pas dire deux choses différentes.
     */
    private function data(Request $request, ShopsOverview $overview): array
    {
        $user = Auth::user();
        abort_unless($user->role === 'super_admin', 403);

        $period = $this->period($request);
        ['start' => $start, 'end' => $end, 'previous_start' => $previousStart, 'previous_end' => $previousEnd] = $period;

        $shops = $user->accessibleShopsQuery()->orderBy('name')->get(['shops.id', 'shops.name', 'shops.currency', 'shops.is_active']);

        $current = $overview->figures($shops, $start, $end);
        $previous = $overview->figures($shops, $previousStart, $previousEnd, withSnapshot: false);

        $rows = $shops->map(fn ($shop) => [
            'id' => $shop->id,
            'name' => $shop->name,
            'currency' => $shop->currency,
            'currency_symbol' => get_currency_symbol($shop->currency),
            'is_active' => (bool) $shop->is_active,
            'figures' => $current[$shop->id],
            'previous' => $previous[$shop->id],
        ])->values();

        return [
            'rows' => $rows,
            // Des boutiques dans des pays différents ne s'additionnent pas : un total par devise.
            'totals' => $rows->groupBy('currency')->map(fn ($group, $currency) => [
                'currency' => $currency,
                'currency_symbol' => get_currency_symbol($currency),
                'figures' => $this->sum($group->pluck('figures')),
                'previous' => $this->sum($group->pluck('previous')),
            ])->values(),
            'period' => $this->periodProps($period),
        ];
    }

    /** @return array{0: CarbonInterface, 1: CarbonInterface} */
    private function range(string $period, array $validated): array
    {
        $now = Carbon::now();

        return match ($period) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'custom' => [Carbon::parse($validated['date_from'])->startOfDay(), Carbon::parse($validated['date_to'])->endOfDay()],
            default => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
        };
    }

    /**
     * La période à laquelle on se compare : la précédente du même genre (hier, la semaine,
     * le mois, l'année d'avant), ou, pour des dates libres, autant de jours juste avant.
     *
     * @return array{0: CarbonInterface, 1: CarbonInterface}
     */
    private function previousRange(string $period, CarbonInterface $start, CarbonInterface $end): array
    {
        return match ($period) {
            'today' => [$start->copy()->subDay(), $end->copy()->subDay()],
            'week' => [$start->copy()->subWeek(), $end->copy()->subWeek()],
            'month' => [$start->copy()->subMonthNoOverflow()->startOfMonth(), $start->copy()->subMonthNoOverflow()->endOfMonth()],
            'year' => [$start->copy()->subYear(), $end->copy()->subYear()],
            default => (function () use ($start, $end) {
                $days = (int) $start->diffInDays($end) + 1;

                return [$start->copy()->subDays($days), $start->copy()->subDay()->endOfDay()];
            })(),
        };
    }

    /** Somme, clé par clé ; le panier moyen se recalcule, il ne s'additionne pas. */
    private function sum($figures): array
    {
        $total = [];

        foreach ($figures as $row) {
            foreach ($row as $key => $value) {
                $total[$key] = ($total[$key] ?? 0) + $value;
            }
        }

        if (isset($total['average_basket'])) {
            $total['average_basket'] = ($total['count'] ?? 0) > 0 ? round($total['revenue'] / $total['count'], 2) : 0.0;
        }

        return array_map(fn ($value) => is_float($value) ? round($value, 2) : $value, $total);
    }
}
