<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CreditController extends Controller
{
    /**
     * Vue principale des créances
     */
    public function index(Request $request): Response
    {
        $user         = Auth::user();
        $activeShopId = get_active_shop_id();
        $shopId       = $request->input('shop_id');
        $search       = $request->input('search');
        $sort         = $request->input('sort', 'overdue_first'); // overdue_first | amount_desc | date_asc
        $status       = $request->input('status'); // overdue | due_soon | all

        $shops   = $user->accessibleShops();
        $shopIds = $shops->pluck('id');

        // Base : ventes avec un reste > 0, non annulées
        $query = Sale::with(['shop', 'customer', 'user'])
            ->whereIn('shop_id', $shopIds)
            ->whereIn('status', ['pending', 'completed'])
            ->where('remaining_amount', '>', 0);

        // Restriction caissier
        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            $query->where('user_id', $user->id);
        }

        // Filtrer par boutique active
        if ($activeShopId) {
            $query->where('shop_id', $activeShopId);
        } elseif ($shopId) {
            $query->where('shop_id', $shopId);
        }

        // Recherche client / ticket
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%"));
            });
        }

        // Filtre statut
        $today = Carbon::today();
        $soon  = Carbon::today()->addDays(7);

        if ($status === 'overdue') {
            $query->where('credit_due_date', '<', $today)
                  ->whereNotNull('credit_due_date');
        } elseif ($status === 'due_soon') {
            $query->whereBetween('credit_due_date', [$today, $soon]);
        } elseif ($status === 'no_date') {
            $query->whereNull('credit_due_date');
        }

        // Tri — syntaxe compatible MySQL et PostgreSQL
        $isPostgres = DB::getDriverName() === 'pgsql';
        $nullsLast       = $isPostgres ? 'credit_due_date ASC NULLS LAST'
                                       : 'credit_due_date IS NULL, credit_due_date ASC';
        $interval7days   = $isPostgres ? "CURRENT_DATE + INTERVAL '7 days'"
                                       : 'DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
        $today           = $isPostgres ? 'CURRENT_DATE' : 'CURDATE()';

        match ($sort) {
            'amount_desc'   => $query->orderBy('remaining_amount', 'desc'),
            'amount_asc'    => $query->orderBy('remaining_amount', 'asc'),
            'date_asc'      => $query->orderByRaw($nullsLast),
            'date_desc'     => $query->orderBy('credit_due_date', 'desc'),
            'oldest'        => $query->orderBy('sale_date', 'asc'),
            default         => $query->orderByRaw("
                CASE
                    WHEN credit_due_date IS NOT NULL AND credit_due_date < {$today} THEN 0
                    WHEN credit_due_date IS NOT NULL AND credit_due_date <= {$interval7days} THEN 1
                    WHEN credit_due_date IS NOT NULL THEN 2
                    ELSE 3
                END, {$nullsLast}
            "),
        };

        $credits = $query->paginate(25)->withQueryString()->through(fn($sale) => [
            'id'               => $sale->id,
            'ticket_number'    => $sale->ticket_number,
            'sale_date'        => $sale->sale_date->format('Y-m-d'),
            'customer'         => $sale->customer ? [
                'id'    => $sale->customer->id,
                'name'  => $sale->customer->name,
                'phone' => $sale->customer->phone ?? null,
                'email' => $sale->customer->email ?? null,
            ] : null,
            'shop'             => ['id' => $sale->shop->id, 'name' => $sale->shop->name],
            'total'            => $sale->total,
            'amount_paid'      => $sale->amount_paid,
            'remaining_amount' => $sale->remaining_amount,
            'credit_due_date'  => $sale->credit_due_date?->format('Y-m-d'),
            'overdue'          => $sale->credit_due_date && $sale->credit_due_date->isPast(),
            'due_soon'         => $sale->credit_due_date
                && !$sale->credit_due_date->isPast()
                && $sale->credit_due_date->lte($soon),
            'days_overdue'     => $sale->credit_due_date && $sale->credit_due_date->isPast()
                ? $today->diffInDays($sale->credit_due_date)
                : null,
            'days_until_due'   => $sale->credit_due_date && $sale->credit_due_date->isFuture()
                ? $today->diffInDays($sale->credit_due_date)
                : null,
            'notes'            => $sale->notes,
        ]);

        // ── KPIs ────────────────────────────────────────────────────────────
        $kpiBase = Sale::whereIn('shop_id', $shopIds)
            ->whereIn('status', ['pending', 'completed'])
            ->where('remaining_amount', '>', 0);

        if ($activeShopId) $kpiBase->where('shop_id', $activeShopId);
        if (in_array($user->role, ['cashier', 'caisse', 'employee'])) {
            $kpiBase->where('user_id', $user->id);
        }

        $kpis = [
            'total_remaining'   => round((clone $kpiBase)->sum('remaining_amount')),
            'total_count'       => (clone $kpiBase)->count(),
            'overdue_remaining' => round((clone $kpiBase)
                ->where('credit_due_date', '<', $today)
                ->whereNotNull('credit_due_date')
                ->sum('remaining_amount')),
            'overdue_count'     => (clone $kpiBase)
                ->where('credit_due_date', '<', $today)
                ->whereNotNull('credit_due_date')
                ->count(),
            'due_soon_count'    => (clone $kpiBase)
                ->whereBetween('credit_due_date', [$today, $soon])
                ->count(),
            'no_date_count'     => (clone $kpiBase)
                ->whereNull('credit_due_date')
                ->count(),
        ];

        return Inertia::render('Sales/Credits', [
            'credits' => $credits,
            'shops'   => $shops,
            'kpis'    => $kpis,
            'filters' => [
                'search'  => $search,
                'shop_id' => $shopId,
                'sort'    => $sort,
                'status'  => $status,
            ],
        ]);
    }

    /**
     * Enregistrer un paiement partiel ou total depuis la vue créances
     */
    public function pay(Request $request, string $code_user, Sale $sale)
    {
        $user = Auth::user();

        if (!$user->accessibleShopsQuery()->where('id', $sale->shop_id)->exists()) {
            abort(403);
        }

        if ($sale->remaining_amount <= 0) {
            return back()->with('error', 'Cette vente n\'a pas de reste à payer.');
        }

        $validated = $request->validate([
            'amount'          => "required|numeric|min:0.01|max:{$sale->remaining_amount}",
            'payment_method'  => 'required|in:cash,card,transfer,check,mobile',
            'notes'           => 'nullable|string|max:500',
            'new_due_date'    => 'nullable|date|after_or_equal:today',
        ]);

        $newRemaining = round($sale->remaining_amount - $validated['amount'], 2);
        $note = "[Relance " . now()->format('d/m/Y') . ": +"
            . number_format($validated['amount'], 0, ',', ' ')
            . " FCFA via " . $validated['payment_method'] . "]";

        if (!empty($validated['notes'])) {
            $note .= " — " . $validated['notes'];
        }

        $sale->update([
            'amount_paid'      => $sale->amount_paid + $validated['amount'],
            'remaining_amount' => $newRemaining,
            'status'           => $newRemaining <= 0 ? 'completed' : 'pending',
            'credit_due_date'  => $validated['new_due_date'] ?? $sale->credit_due_date,
            'notes'            => $sale->notes ? $sale->notes . "\n" . $note : $note,
        ]);

        ActivityLogger::log('credit_payment', null, $sale, [
            'amount'          => $validated['amount'],
            'remaining'       => $newRemaining,
            'payment_method'  => $validated['payment_method'],
        ]);

        $msg = $newRemaining <= 0
            ? '✅ Créance soldée ! Paiement complet enregistré.'
            : '💳 Paiement enregistré. Reste : ' . number_format($newRemaining, 0, ',', ' ') . ' FCFA';

        return back()->with('success', $msg);
    }

    /**
     * Mettre à jour la date d'échéance d'une créance
     */
    public function updateDueDate(Request $request, string $code_user, Sale $sale)
    {
        if (!Auth::user()->accessibleShopsQuery()->where('id', $sale->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'credit_due_date' => 'nullable|date',
        ]);

        $sale->update(['credit_due_date' => $validated['credit_due_date']]);

        return back()->with('success', 'Échéance mise à jour.');
    }

    /**
     * Export CSV des créances
     */
    public function export(Request $request, string $code_user): StreamedResponse
    {
        $user         = Auth::user();
        $activeShopId = get_active_shop_id();
        $shopIds      = $user->accessibleShops()->pluck('id');

        $credits = Sale::with(['shop', 'customer'])
            ->whereIn('shop_id', $shopIds)
            ->whereIn('status', ['pending', 'completed'])
            ->where('remaining_amount', '>', 0)
            ->when($activeShopId, fn($q) => $q->where('shop_id', $activeShopId))
            ->orderByRaw(
                DB::getDriverName() === 'pgsql'
                    ? 'credit_due_date ASC NULLS LAST'
                    : 'credit_due_date IS NULL, credit_due_date ASC'
            )
            ->get();

        $filename = 'creances_' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($credits) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF"); // BOM UTF-8 pour Excel

            fputcsv($handle, [
                'Ticket', 'Date vente', 'Client', 'Téléphone', 'Boutique',
                'Total', 'Payé', 'Reste à payer', 'Échéance', 'Statut', 'Notes'
            ], ';');

            foreach ($credits as $sale) {
                $today = Carbon::today();
                $status = 'En cours';
                if ($sale->credit_due_date && $sale->credit_due_date < $today) {
                    $status = 'En retard (' . $today->diffInDays($sale->credit_due_date) . 'j)';
                } elseif ($sale->credit_due_date && $sale->credit_due_date->lte($today->addDays(7))) {
                    $status = 'Échéance proche';
                }

                fputcsv($handle, [
                    $sale->ticket_number,
                    $sale->sale_date->format('d/m/Y'),
                    $sale->customer?->name ?? 'Client anonyme',
                    $sale->customer?->phone ?? '',
                    $sale->shop->name,
                    number_format($sale->total, 0, ',', ' '),
                    number_format($sale->amount_paid, 0, ',', ' '),
                    number_format($sale->remaining_amount, 0, ',', ' '),
                    $sale->credit_due_date?->format('d/m/Y') ?? '',
                    $status,
                    $sale->notes ?? '',
                ], ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
