<?php

namespace App\Http\Controllers;

use App\Models\JekoPaymentRequest;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Services\JekoService;
use App\Mail\SubscriptionInvoiceMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class JekoController extends Controller
{
    public function __construct(private JekoService $jeko) {}

    /**
     * Initiate a Jèko payment request for a subscription plan.
     */
    public function initiate(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        abort_if(!$plan->is_active, 404);

        $validated = $request->validate([
            'billing_cycle' => 'required|in:monthly,yearly',
            'payment_method' => 'required|in:wave,orange,mtn,moov,djamo',
        ]);

        $user = Auth::user();
        abort_if($user->role !== 'super_admin', 403, "Seul le propriétaire du compte peut gérer l'abonnement.");
        $months = $validated['billing_cycle'] === 'yearly' ? 12 : 1;

        // Calculate amount: yearly = price * 10, monthly = price
        $amount = $validated['billing_cycle'] === 'yearly'
            ? round((float) $plan->price * 10)
            : (float) $plan->price;

        // Convert to cents (XOF uses integer cents: 500 XOF = 50000 cents)
        $amountCents = (int) round($amount * 100);

        // Generate unique reference
        $reference = 'BTX-' . $user->id . '-' . $plan->id . '-' . Str::random(8);

        // Build redirect URLs
        $successUrl = url('/jeko/success?ref=' . urlencode($reference));
        $errorUrl = url('/jeko/error?ref=' . urlencode($reference));

        // Create payment request via Jèko API
        $result = $this->jeko->createPaymentRequest([
            'storeId' => config('services.jeko.store_id'),
            'amountCents' => $amountCents,
            'currency' => 'XOF',
            'reference' => $reference,
            'paymentDetails' => [
                'type' => 'redirect',
                'data' => [
                    'paymentMethod' => $this->mapPaymentMethod($validated['payment_method']),
                    'successUrl' => $successUrl,
                    'errorUrl' => $errorUrl,
                ],
            ],
        ]);

        $paymentRequestId = $result['id'] ?? null;
        $redirectUrl = $result['redirectUrl'] ?? null;

        if (!$paymentRequestId || !$redirectUrl) {
            Log::warning('Jèko initiate failed', ['result' => $result, 'plan' => $plan->id]);

            $message = $result['errorMessage']
                ?? $result['message']
                ?? 'Échec de l\'initiation du paiement. Veuillez réessayer.';

            return response()->json(['success' => false, 'message' => $message], 422);
        }

        // Save payment request
        JekoPaymentRequest::create([
            'payment_request_id' => $paymentRequestId,
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'billing_cycle' => $validated['billing_cycle'],
            'amount_cents' => $amountCents,
            'currency' => 'XOF',
            'payment_method' => $validated['payment_method'],
            'reference' => $reference,
            'status' => 'pending',
            'redirect_url' => $redirectUrl,
            'metadata' => $result,
        ]);

        return response()->json([
            'success' => true,
            'redirectUrl' => $redirectUrl,
        ]);
    }

    /**
     * Handle success redirect from Jèko.
     */
    public function success(Request $request): RedirectResponse
    {
        $reference = $request->query('ref');

        if (!$reference) {
            return redirect('/plans')->with('error', 'Référence de paiement manquante.');
        }

        $payment = JekoPaymentRequest::where('reference', $reference)->first();

        if (!$payment) {
            Log::warning('Jèko success: payment request not found', ['reference' => $reference]);
            return redirect('/plans')->with('error', 'Paiement introuvable.');
        }

        // Verify status from API if still pending
        if ($payment->status === 'pending') {
            $result = $this->jeko->getPaymentRequest($payment->payment_request_id);
            $newStatus = $result['status'] ?? $payment->status;

            $payment->update([
                'status' => $newStatus,
                'metadata' => $result ?: $payment->metadata,
                'completed_at' => $newStatus === 'success' ? now() : null,
            ]);
            $payment->refresh();
        }

        // Activate subscription if successful
        if ($payment->status === 'success' && !$payment->subscription_activated) {
            $this->activateSubscription($payment);
            $payment->refresh();
        }

        if ($payment->subscription_activated) {
            return redirect('/' . $payment->user->accountCode() . '/dashboard')
                ->with('success', 'Paiement confirmé et abonnement activé !');
        }

        return redirect('/plans')->with('error', 'Le paiement n\'a pas pu être confirmé.');
    }

    /**
     * Handle error redirect from Jèko.
     */
    public function error(Request $request): RedirectResponse
    {
        $reference = $request->query('ref');

        if ($reference) {
            $payment = JekoPaymentRequest::where('reference', $reference)->first();
            if ($payment) {
                $payment->update(['status' => 'error', 'completed_at' => now()]);
            }
        }

        return redirect('/plans')->with('error', 'Le paiement a échoué. Veuillez réessayer.');
    }

    /**
     * Webhook called by Jèko on transaction completion.
     */
    public function webhook(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $signature = $request->header('Jeko-Signature');
        $webhookSecret = config('services.jeko.webhook_secret', '');

        // Verify signature
        if (!$this->verifySignature($rawBody, $signature, $webhookSecret)) {
            Log::warning('Jèko webhook signature verification failed');
            return response()->json(['ok' => false], 401);
        }

        $payload = $request->all();
        Log::info('Jèko webhook received', [
            'transactionType' => $payload['transactionType'] ?? null,
            'status' => $payload['status'] ?? null,
            'reference' => $payload['transactionDetails']['reference'] ?? null,
        ]);

        $transactionType = $payload['transactionType'] ?? null;
        $status = $payload['status'] ?? null;
        $reference = $payload['transactionDetails']['reference'] ?? null;

        // Only process successful payments
        if ($transactionType !== 'payment' || $status !== 'success' || !$reference) {
            return response()->json(['ok' => true]);
        }

        $payment = JekoPaymentRequest::where('reference', $reference)->first();

        if (!$payment) {
            // Unknown payment – acknowledge anyway
            return response()->json(['ok' => true]);
        }

        $payment->update([
            'status' => 'success',
            'metadata' => $payload,
            'completed_at' => now(),
        ]);

        if (!$payment->subscription_activated) {
            $this->activateSubscription($payment);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Create subscription and invoice after successful payment.
     */
    private function activateSubscription(JekoPaymentRequest $payment): void
    {
        // Verrou + re-vérification de `subscription_activated` à l'intérieur de la
        // transaction : le webhook et le polling du frontend peuvent arriver en même
        // temps, et sans ce verrou les deux passeraient le check avant que l'un des
        // deux persiste le flag, créant deux abonnements/factures pour un seul paiement.
        $result = DB::transaction(function () use ($payment) {
            $locked = JekoPaymentRequest::where('id', $payment->id)->lockForUpdate()->first();

            if (!$locked || $locked->subscription_activated) {
                return null;
            }

            $user = $locked->user;
            $plan = $locked->plan;
            $months = $locked->billing_cycle === 'yearly' ? 12 : 1;

            // Convert cents back to XOF for storage
            $amountXof = $locked->amount_cents / 100;

            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'status' => 'active',
                'started_at' => now(),
                'expires_at' => now()->addMonths($months),
                'amount' => $amountXof,
                'billing_cycle' => $locked->billing_cycle,
                'metadata' => [
                    'payment_method' => 'jeko',
                    'payment_method_display' => $this->getPaymentMethodLabel($locked->payment_method),
                    'jeko_payment_request_id' => $locked->payment_request_id,
                ],
            ]);

            $subscriptionInvoice = SubscriptionInvoice::create([
                'subscription_id' => $subscription->id,
                'user_id' => $user->id,
                'invoice_number' => SubscriptionInvoice::generateInvoiceNumber(),
                'amount' => $amountXof,
                'tax' => 0,
                'total' => $amountXof,
                'status' => 'paid',
                'issued_at' => now(),
                'paid_at' => now(),
                'due_at' => now(),
                'payment_method' => 'jeko',
                'metadata' => [
                    'jeko_payment_request_id' => $locked->payment_request_id,
                    'payment_method_display' => $this->getPaymentMethodLabel($locked->payment_method),
                ],
            ]);

            $locked->update(['subscription_activated' => true]);

            return [$user, $subscription, $subscriptionInvoice];
        });

        if (!$result) {
            return;
        }

        // Send email outside transaction
        [$user, $subscription, $subscriptionInvoice] = $result;
        try {
            Mail::to($user->email)->send(
                new SubscriptionInvoiceMail($user, $subscription, $subscriptionInvoice)
            );
        } catch (\Throwable $e) {
            Log::error('SubscriptionInvoiceMail failed', ['user' => $user->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Map frontend payment method names to Jèko API values.
     */
    private function mapPaymentMethod(string $method): string
    {
        $map = [
            'wave' => 'wave',
            'orange' => 'orange',
            'mtn' => 'mtn',
            'moov' => 'moov',
            'djamo' => 'djamo',
        ];

        return $map[$method] ?? 'wave';
    }

    /**
     * Get readable label for payment method.
     */
    private function getPaymentMethodLabel(string $method): string
    {
        $labels = [
            'wave' => 'Wave',
            'orange' => 'Orange Money',
            'mtn' => 'MTN',
            'moov' => 'Moov Money',
            'djamo' => 'DJAMO',
        ];

        return $labels[$method] ?? $method;
    }

    /**
     * Verify webhook signature using HMAC-SHA256.
     */
    private function verifySignature(string $rawBody, ?string $signature, string $secret): bool
    {
        if (!$signature || !$secret) {
            return false;
        }

        $expected = hash_hmac('sha256', $rawBody, $secret);
        return hash_equals($expected, $signature);
    }
}
