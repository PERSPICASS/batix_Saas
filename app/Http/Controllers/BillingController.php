<?php

namespace App\Http\Controllers;

use App\Models\PawaPayDeposit;
use App\Models\SubscriptionInvoice;
use Illuminate\Http\Response as HtmlResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $invoices = SubscriptionInvoice::where('user_id', $user->id)
            ->with('subscription.plan')
            ->latest('issued_at')
            ->get()
            ->map(fn($inv) => [
                'id'             => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'plan_name'      => $inv->subscription?->plan?->name ?? '—',
                'billing_cycle'  => $inv->subscription?->billing_cycle,
                'amount'         => (float) $inv->total,
                'currency'       => 'XOF',
                'status'         => $inv->status,
                'payment_method' => $inv->payment_method,
                'correspondent'  => $inv->metadata['correspondent'] ?? null,
                'msisdn'         => $inv->metadata['msisdn'] ?? null,
                'issued_at'      => $inv->issued_at?->toDateString(),
                'paid_at'        => $inv->paid_at?->toDateString(),
                'expires_at'     => $inv->subscription?->expires_at?->toDateString(),
            ]);

        $deposits = PawaPayDeposit::where('user_id', $user->id)
            ->with('plan')
            ->latest()
            ->get()
            ->map(fn($d) => [
                'id'            => $d->id,
                'deposit_id'    => $d->deposit_id,
                'plan_name'     => $d->plan?->name ?? '—',
                'billing_cycle' => $d->billing_cycle,
                'amount'        => (float) $d->amount,
                'currency'      => $d->currency,
                'correspondent' => $d->correspondent,
                'msisdn'        => $d->msisdn,
                'status'        => $d->status,
                'created_at'    => $d->created_at->toDateString(),
                'completed_at'  => $d->completed_at?->toDateString(),
            ]);

        $activeSubscription = $user->activeSubscription()?->load('plan');
        $currentSubscription = $activeSubscription ? [
            'plan_name'      => $activeSubscription->plan?->name,
            'plan_slug'      => $activeSubscription->plan?->slug,
            'billing_cycle'  => $activeSubscription->billing_cycle,
            'status'         => $activeSubscription->status,
            'expires_at'     => $activeSubscription->expires_at?->toDateString(),
            'days_left'      => $activeSubscription->expires_at
                                    ? (int) now()->diffInDays($activeSubscription->expires_at, false)
                                    : null,
        ] : null;

        return Inertia::render('Billing/Index', [
            'invoices'            => $invoices,
            'deposits'            => $deposits,
            'currentSubscription' => $currentSubscription,
        ]);
    }

    public function downloadInvoice(string $code_user, SubscriptionInvoice $subscriptionInvoice): HtmlResponse
    {
        abort_if($subscriptionInvoice->user_id !== Auth::id(), 403);

        $subscriptionInvoice->load('subscription.plan', 'user');

        $html = view('billing.invoice-print', ['invoice' => $subscriptionInvoice])->render();

        return response($html)->header('Content-Type', 'text/html');
    }
}
