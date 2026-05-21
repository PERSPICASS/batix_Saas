<?php

namespace App\Http\Controllers;

use App\Models\PawaPayDeposit;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Services\PawaPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Mail\SubscriptionInvoiceMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PawaPayController extends Controller
{
    public function __construct(private PawaPayService $pawaPay) {}

    /**
     * Initiate a PawaPay deposit for a subscription plan.
     */
    public function initiate(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        abort_if(!$plan->is_active, 404);

        $validated = $request->validate([
            'billing_cycle' => 'required|in:monthly,yearly',
            'correspondent' => 'required|string|max:50',
            'msisdn'        => 'required|string|max:30',
            'currency'      => 'required|string|size:3',
        ]);

        $user    = Auth::user();
        $months  = $validated['billing_cycle'] === 'yearly' ? 12 : 1;
        $amount  = $validated['billing_cycle'] === 'yearly'
            ? round((float) $plan->price * 10)
            : (float) $plan->price;

        // PawaPay requires the amount as a decimal string with the correct
        // number of decimal places for the currency (XOF/GNF = 0, GHS = 2).
        $decimals  = $validated['currency'] === 'GHS' ? 2 : 0;
        $amountStr = number_format($amount, $decimals, '.', '');

        $depositId = (string) Str::uuid();
        $msisdn    = preg_replace('/[^0-9]/', '', $validated['msisdn']);

        $result = $this->pawaPay->initiateDeposit(
            depositId:   $depositId,
            amount:      $amountStr,
            currency:    $validated['currency'],
            correspondent: $validated['correspondent'],
            msisdn:      $msisdn,
            description: "Batix {$plan->name}"
        );

        $status = $result['status'] ?? 'FAILED';

        if (!in_array($status, ['INITIATED', 'SUBMITTED', 'ACCEPTED'])) {
            Log::warning('PawaPay initiate failed', ['result' => $result, 'plan' => $plan->id]);

            $message = $result['errorMessage']
                ?? $result['rejectionReason']['rejectionMessage']
                ?? 'Échec de l\'initiation du paiement. Vérifiez votre numéro et réessayez.';

            return response()->json(['success' => false, 'message' => $message], 422);
        }

        PawaPayDeposit::create([
            'deposit_id'           => $depositId,
            'user_id'              => $user->id,
            'subscription_plan_id' => $plan->id,
            'billing_cycle'        => $validated['billing_cycle'],
            'amount'               => $amountStr,
            'currency'             => $validated['currency'],
            'correspondent'        => $validated['correspondent'],
            'msisdn'               => $msisdn,
            'status'               => $status,
            'metadata'             => $result,
        ]);

        return response()->json([
            'success'   => true,
            'depositId' => $depositId,
            'status'    => $status,
        ]);
    }

    /**
     * Poll deposit status (called by frontend every few seconds).
     */
    public function pollStatus(Request $request, string $depositId): JsonResponse
    {
        $deposit = PawaPayDeposit::where('deposit_id', $depositId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Only re-check non-terminal statuses
        if (!$deposit->isTerminal()) {
            $result    = $this->pawaPay->getDeposit($depositId);
            $newStatus = $result['status'] ?? $deposit->status;

            $deposit->update([
                'status'       => $newStatus,
                'metadata'     => $result ?: $deposit->metadata,
                'completed_at' => $newStatus === 'COMPLETED' ? now() : null,
            ]);

            $deposit->refresh();
        }

        // Retry activation on every poll until confirmed (handles first-poll failures)
        if ($deposit->status === 'COMPLETED' && !$deposit->subscription_activated) {
            $this->activateSubscription($deposit);
            $deposit->refresh();
        }

        return response()->json([
            'status'              => $deposit->status,
            'depositId'           => $deposit->deposit_id,
            'subscriptionActivated' => $deposit->subscription_activated,
        ]);
    }

    /**
     * Sandbox only — simulate deposit completion (dev/staging use).
     */
    public function simulate(string $depositId): JsonResponse
    {
        abort_unless(config('services.pawapay.sandbox'), 403);

        $deposit = PawaPayDeposit::where('deposit_id', $depositId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $result = $this->pawaPay->simulateDeposit($depositId);

        Log::info('PawaPay simulate called', ['depositId' => $depositId, 'result' => $result]);

        return response()->json(['ok' => true, 'result' => $result]);
    }

    /**
     * Webhook endpoint called by PawaPay on payment status changes.
     * Must be reachable without auth (registered in routes outside auth group).
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('PawaPay webhook received', ['depositId' => $payload['depositId'] ?? null]);

        $depositId = $payload['depositId'] ?? null;
        $status    = $payload['status'] ?? null;

        if (!$depositId || !$status) {
            return response()->json(['ok' => false], 400);
        }

        $deposit = PawaPayDeposit::where('deposit_id', $depositId)->first();

        if (!$deposit) {
            // Unknown deposit – acknowledge anyway
            return response()->json(['ok' => true]);
        }

        $deposit->update([
            'status'       => $status,
            'metadata'     => $payload,
            'completed_at' => $status === 'COMPLETED' ? now() : null,
        ]);

        if ($status === 'COMPLETED' && !$deposit->subscription_activated) {
            $this->activateSubscription($deposit);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Create subscription + invoice after successful payment.
     */
    private function activateSubscription(PawaPayDeposit $deposit): void
    {
        if ($deposit->subscription_activated) {
            return;
        }

        $user   = $deposit->user;
        $plan   = $deposit->plan;
        $months = $deposit->billing_cycle === 'yearly' ? 12 : 1;

        $invoice = DB::transaction(function () use ($deposit, $user, $plan, $months) {
            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            $subscription = Subscription::create([
                'user_id'              => $user->id,
                'subscription_plan_id' => $plan->id,
                'status'               => 'active',
                'started_at'           => now(),
                'expires_at'           => now()->addMonths($months),
                'amount'               => $deposit->amount,
                'billing_cycle'        => $deposit->billing_cycle,
                'metadata'             => [
                    'payment_method'     => 'pawapay',
                    'correspondent'      => $deposit->correspondent,
                    'msisdn'             => $deposit->msisdn,
                    'pawapay_deposit_id' => $deposit->deposit_id,
                ],
            ]);

            $invoice = SubscriptionInvoice::create([
                'subscription_id' => $subscription->id,
                'user_id'         => $user->id,
                'invoice_number'  => SubscriptionInvoice::generateInvoiceNumber(),
                'amount'          => $deposit->amount,
                'tax'             => 0,
                'total'           => $deposit->amount,
                'status'          => 'paid',
                'issued_at'       => now(),
                'paid_at'         => now(),
                'due_at'          => now(),
                'payment_method'  => 'pawapay',
                'metadata'        => [
                    'pawapay_deposit_id' => $deposit->deposit_id,
                    'correspondent'      => $deposit->correspondent,
                    'msisdn'             => $deposit->msisdn,
                ],
            ]);

            $deposit->update(['subscription_activated' => true]);

            return [$subscription, $invoice];
        });

        // Mail hors transaction : un échec d'envoi ne rollback pas l'activation
        try {
            [$subscription, $invoice] = $invoice;
            Mail::to($user->email)->send(
                new SubscriptionInvoiceMail($user, $subscription, $invoice)
            );
        } catch (\Throwable $e) {
            Log::error('SubscriptionInvoiceMail failed', ['user' => $user->id, 'error' => $e->getMessage()]);
        }
    }
}
