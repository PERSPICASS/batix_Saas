<?php

namespace App\Services;

use App\Models\FixedCost;
use App\Models\Subscription;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Revenue figures for the platform-admin Dashboard and MRR pages.
 *
 * Everything is in FCFA: plan prices and subscriptions.amount are stored in
 * FCFA by every payment provider, Paddle included.
 *
 * MRR is computed from a snapshot at a given moment ("who was paying then?"),
 * never from today's status — filtering on status = 'active' would erase every
 * churned customer from the past months. Movements (new / churn / expansion)
 * are measured per account, so an upgrade, which cancels the old subscription
 * and opens a new one, is an expansion and not a churn.
 */
class PlatformMetrics
{
    /** Monthly value of a subscription (a yearly amount is spread over 12). */
    public static function monthlyAmount(Subscription $subscription): float
    {
        $amount = (float) $subscription->amount;

        return $subscription->billing_cycle === 'yearly' ? $amount / 12 : $amount;
    }

    /**
     * Subscriptions that were paying at $moment. Free trials (amount 0) and
     * unpaid pending requests are excluded.
     */
    public function payingAt(CarbonInterface $moment): Collection
    {
        return Subscription::with(['plan', 'user'])
            ->where('amount', '>', 0)
            ->whereNotIn('status', ['pending', 'trial'])
            ->whereNotNull('started_at')
            ->where('started_at', '<=', $moment)
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', $moment))
            ->where(fn ($q) => $q->whereNull('cancelled_at')->orWhere('cancelled_at', '>', $moment))
            ->get();
    }

    /** MRR per account (user_id => monthly amount) at $moment. */
    public function mrrByAccountAt(CarbonInterface $moment): Collection
    {
        return $this->payingAt($moment)
            ->groupBy('user_id')
            ->map(fn (Collection $subs) => $subs->sum(fn ($s) => self::monthlyAmount($s)));
    }

    public function mrrAt(CarbonInterface $moment): float
    {
        return (float) $this->mrrByAccountAt($moment)->sum();
    }

    /**
     * MRR movements over a period, account by account.
     *
     * @return array{start_mrr: float, end_mrr: float, new_mrr: float, expansion_mrr: float,
     *               contraction_mrr: float, churned_mrr: float, start_count: int,
     *               end_count: int, churned_count: int, churned_user_ids: array<int>}
     */
    public function movements(CarbonInterface $from, CarbonInterface $to): array
    {
        $start = $this->mrrByAccountAt($from);
        $end = $this->mrrByAccountAt($to);

        $new = $expansion = $contraction = $churned = 0.0;
        $churnedIds = [];

        foreach ($end as $userId => $mrr) {
            $before = $start->get($userId);
            if ($before === null) {
                $new += $mrr;
            } elseif ($mrr > $before) {
                $expansion += $mrr - $before;
            } elseif ($mrr < $before) {
                $contraction += $before - $mrr;
            }
        }

        foreach ($start as $userId => $mrr) {
            if (!$end->has($userId)) {
                $churned += $mrr;
                $churnedIds[] = $userId;
            }
        }

        return [
            'start_mrr' => (float) $start->sum(),
            'end_mrr' => (float) $end->sum(),
            'new_mrr' => $new,
            'expansion_mrr' => $expansion,
            'contraction_mrr' => $contraction,
            'churned_mrr' => $churned,
            'start_count' => $start->count(),
            'end_count' => $end->count(),
            'churned_count' => count($churnedIds),
            'churned_user_ids' => $churnedIds,
        ];
    }

    /**
     * Monthly fixed costs in FCFA. An annual cost's amount is per billing
     * cycle, so it is spread over 12 months.
     */
    public function monthlyFixedCosts(?CarbonInterface $at = null): float
    {
        $at ??= Carbon::now();

        return (float) FixedCost::where('is_active', true)
            ->where(fn ($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', $at))
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $at->copy()->startOfDay()))
            ->get()
            ->sum(fn (FixedCost $cost) => self::fixedCostMonthlyXof($cost));
    }

    public static function fixedCostMonthlyXof(FixedCost $cost): float
    {
        $amount = CurrencyService::convert((float) $cost->amount_monthly, $cost->currency ?: 'FCFA', 'FCFA');

        return $cost->billing_cycle === 'annual' ? $amount / 12 : $amount;
    }

    /**
     * End of $month as a snapshot moment, capped at now for the current month.
     */
    public static function monthEnd(CarbonInterface $month): Carbon
    {
        $end = Carbon::instance($month)->copy()->endOfMonth();

        return $end->isFuture() ? Carbon::now() : $end;
    }
}
