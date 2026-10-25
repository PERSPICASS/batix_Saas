<?php

namespace App\Http\Controllers;

use App\Services\ShopsOverview;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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
        $user = Auth::user();
        abort_unless($user->role === 'super_admin', 403);

        $validated = $request->validate([
            'period' => ['nullable', 'in:'.implode(',', self::PERIODS)],
            'date_from' => ['nullable', 'date', 'required_if:period,custom'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from', 'required_if:period,custom'],
        ]);
        $period = $validated['period'] ?? 'month';

        [$start, $end] = $this->range($period, $validated);
        [$previousStart, $previousEnd] = $this->previousRange($period, $start, $end);

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

        return Inertia::render('Shops/Overview', [
            'rows' => $rows,
            // Des boutiques dans des pays différents ne s'additionnent pas : un total par devise.
            'totals' => $rows->groupBy('currency')->map(fn ($group, $currency) => [
                'currency' => $currency,
                'currency_symbol' => get_currency_symbol($currency),
                'figures' => $this->sum($group->pluck('figures')),
                'previous' => $this->sum($group->pluck('previous')),
            ])->values(),
            'period' => [
                'key' => $period,
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'previous_start' => $previousStart->toDateString(),
                'previous_end' => $previousEnd->toDateString(),
            ],
            'filters' => (object) $request->only(['period', 'date_from', 'date_to']),
        ]);
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
