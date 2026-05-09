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
use Illuminate\Support\Facades\Log;
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
            ? round($plan->price * 12 * 0.85)
            : $plan->price;

        $depositId = (string) Str::uuid();
        $msisdn    = preg_replace('/[^0-9]/', '', $validated['msisdn']);

        $result = $this->pawaPay->initiateDeposit(
            depositId:   $depositId,
            amount:      (string) $amount,
            currency:    $validated['currency'],
            correspondent: $validated['correspondent'],
            msisdn:      $msisdn,
            description: "Batix {$plan->name}"
        );

        $status = $result['status'] ?? 'FAILED';

        if (!in_array($status, ['INITIATED', 'SUBMITTED'])) {
            Log::warning('PawaPay initiate failed', ['result' => $result, 'plan' => $plan->id]);

            return response()->json([
                'success' => false,
                'message' => $result['errorMessage'] ?? 'Échec de l\'initiation du paiement. Vérifiez votre numéro et réessayez.',
            ], 422);
        }

        PawaPayDeposit::create([
            'deposit_id'           => $depositId,
            'user_id'              => $user->id,
            'subscription_plan_id' => $plan->id,
            'billing_cycle'        => $validated['billing_cycle'],
            'amount'               => $amount,
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

            if ($newStatus === 'COMPLETED' && !$deposit->subscription_activated) {
                $this->activateSubscription($deposit);
                $deposit->refresh();
            }
        }

        return response()->json([
            'status'              => $deposit->status,
            'depositId'           => $deposit->deposit_id,
            'subscriptionActivated' => $deposit->subscription_activated,
        ]);
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
        // Idempotency guard
        if ($deposit->subscription_activated) {
            return;
        }

        DB::transaction(function () use ($deposit) {
            $user   = $deposit->user;
            $plan   = $deposit->plan;
            $months = $deposit->billing_cycle === 'yearly' ? 12 : 1;

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

            SubscriptionInvoice::create([
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
        });
    }
}
