<?php

namespace App\Http\Controllers;

use App\Mail\SubscriptionInvoiceMail;
use App\Models\MonerooPayment;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Services\MonerooService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class MonerooController extends Controller
{
    public function __construct(private MonerooService $moneroo) {}

    public function initiate(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        abort_if(! $plan->is_active, 404);

        $validated = $request->validate([
            'billing_cycle' => 'required|in:monthly,yearly',
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'phone' => 'nullable|string|max:25|regex:/^\+[1-9][0-9]{6,14}$/',
            'country' => 'nullable|string|size:2|alpha',
        ]);

        $user = Auth::user();
        abort_if($user->role !== 'super_admin', 403, "Seul le propriétaire du compte peut gérer l'abonnement.");

        if (! $this->moneroo->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => "Le paiement Moneroo n'est pas encore configuré.",
            ], 422);
        }

        // Les tarifs Batix sont définis en XOF. L'offre annuelle correspond à dix
        // mensualités payées pour douze mois de service.
        $amount = $validated['billing_cycle'] === 'yearly'
            ? round((float) $plan->price * 10, 2)
            : round((float) $plan->price, 2);

        $reference = 'BTX-'.$user->id.'-'.$plan->id.'-'.Str::upper(Str::random(10));

        // Créée avant l'appel réseau : cette ligne, et non le navigateur ou le
        // webhook, détermine le compte, le plan, le cycle et le montant attendus.
        $payment = MonerooPayment::create([
            'reference' => $reference,
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'billing_cycle' => $validated['billing_cycle'],
            'status' => 'initiated',
            'amount' => $amount,
            'currency' => 'XOF',
        ]);

        $customer = [
            'email' => $user->email,
            'first_name' => trim($validated['first_name']),
            'last_name' => trim($validated['last_name']),
        ];

        if (! empty($validated['phone'])) {
            $customer['phone'] = $validated['phone'];
        }

        if (! empty($validated['country'])) {
            $customer['country'] = strtoupper($validated['country']);
        }

        $result = $this->moneroo->initializePayment([
            'amount' => (int) round($amount),
            'currency' => 'XOF',
            'description' => "Abonnement Batix {$plan->name} ({$validated['billing_cycle']})",
            'return_url' => route('moneroo.return', ['ref' => $reference]),
            'customer' => $customer,
            'metadata' => [
                'reference' => $reference,
                'user_id' => (string) $user->id,
                'plan_id' => (string) $plan->id,
                'billing_cycle' => $validated['billing_cycle'],
            ],
        ]);

        $data = $result['data'] ?? [];
        $paymentId = $data['id'] ?? null;
        $checkoutUrl = $data['checkout_url'] ?? $data['link'] ?? null;

        if (! $result['ok'] || ! $paymentId || ! $checkoutUrl) {
            $payment->update([
                'status' => 'failed',
                'metadata' => $result['raw'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? "Échec de l'ouverture du paiement. Veuillez réessayer.",
            ], 422);
        }

        $payment->update([
            'payment_id' => (string) $paymentId,
            'checkout_url' => (string) $checkoutUrl,
            'metadata' => $result['raw'] ?? $data,
        ]);

        return response()->json([
            'success' => true,
            'redirectUrl' => $checkoutUrl,
        ]);
    }

    public function handleReturn(Request $request): RedirectResponse
    {
        $reference = $request->query('ref');

        $payment = $reference
            ? MonerooPayment::where('reference', $reference)
                ->where('user_id', Auth::id())
                ->first()
            : null;

        if (! $payment) {
            return redirect('/plans')->with('error', 'Paiement introuvable.');
        }

        $returnedId = $request->query('paymentId') ?? $request->query('monerooPaymentId');

        if ($returnedId && ! hash_equals((string) $payment->payment_id, (string) $returnedId)) {
            Log::warning('Moneroo: identifiant de retour incohérent', [
                'reference' => $payment->reference,
                'returned_id' => $returnedId,
            ]);

            return redirect('/plans')->with('error', 'Le paiement retourné ne correspond pas à votre transaction.');
        }

        $synchronized = $this->synchronizePayment($payment);
        $payment->refresh();

        if ($payment->subscription_activated) {
            return redirect('/'.$payment->user->accountCode().'/dashboard')
                ->with('success', 'Paiement confirmé et abonnement activé !');
        }

        if ($synchronized === false || $payment->status === 'verification_failed') {
            return redirect('/plans')->with('error', "Le paiement n'a pas pu être validé automatiquement. Notre équipe a été prévenue.");
        }

        return redirect('/plans')->with('info', 'Paiement en cours de confirmation. Votre abonnement sera activé dès réception.');
    }

    public function webhook(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $signature = $request->header('X-Moneroo-Signature');

        if (! $this->moneroo->verifyWebhookSignature($rawBody, $signature)) {
            Log::warning('Moneroo: signature de webhook invalide');

            return response()->json(['ok' => false], 403);
        }

        $payload = $request->json()->all();
        $paymentId = data_get($payload, 'data.id');

        Log::info('Moneroo: webhook reçu', [
            'event' => $payload['event'] ?? null,
            'payment_id' => $paymentId,
        ]);

        if (! $paymentId) {
            return response()->json(['ok' => false], 400);
        }

        $payment = MonerooPayment::where('payment_id', $paymentId)->first();

        if (! $payment) {
            // Transaction créée hors de Batix : elle ne doit rien activer ici.
            return response()->json(['ok' => true]);
        }

        $synchronized = $this->synchronizePayment($payment);

        // Un échec temporaire de l'API doit provoquer un retry du webhook Moneroo.
        if ($synchronized === null) {
            return response()->json(['ok' => false], 503);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Retourne null quand l'API est indisponible, false quand l'intégrité échoue,
     * true quand la réponse a été vérifiée (quel que soit son statut métier).
     */
    private function synchronizePayment(MonerooPayment $payment): ?bool
    {
        if (! $payment->payment_id) {
            return false;
        }

        $result = $this->moneroo->verifyPayment($payment->payment_id);

        if (! $result['ok']) {
            return null;
        }

        $data = $result['data'] ?? [];
        $verifiedId = (string) ($data['id'] ?? '');
        $status = strtolower((string) ($data['status'] ?? ''));
        $amount = is_numeric($data['amount'] ?? null) ? (float) $data['amount'] : null;
        $currency = $this->currencyCode($data['currency'] ?? null);
        $reference = $this->metadataReference($data['metadata'] ?? null);

        $integrityErrors = array_values(array_filter([
            $verifiedId === (string) $payment->payment_id ? null : 'payment_id',
            $reference === $payment->reference ? null : 'reference',
            $currency === $payment->currency ? null : 'currency',
            $amount !== null && $amount + 0.01 >= (float) $payment->amount ? null : 'amount',
        ]));

        if ($integrityErrors) {
            Log::error('Moneroo: contrôle d\'intégrité du paiement refusé', [
                'reference' => $payment->reference,
                'fields' => $integrityErrors,
                'status' => $status,
            ]);

            $payment->update([
                'status' => 'verification_failed',
                'metadata' => $data,
                'completed_at' => now(),
            ]);

            return false;
        }

        $payment->update([
            'status' => $status ?: $payment->status,
            'metadata' => $data,
            'verified_at' => now(),
            'completed_at' => in_array($status, ['success', 'failed', 'cancelled'], true) ? now() : null,
        ]);

        if ($status === 'success') {
            $this->activateSubscription($payment);
        }

        return true;
    }

    private function currencyCode(mixed $currency): ?string
    {
        if (is_string($currency)) {
            return strtoupper($currency);
        }

        if (is_array($currency)) {
            $code = $currency['code'] ?? $currency['symbol'] ?? null;

            return is_string($code) ? strtoupper($code) : null;
        }

        return null;
    }

    private function metadataReference(mixed $metadata): ?string
    {
        if (! is_array($metadata)) {
            return null;
        }

        $reference = $metadata['reference'] ?? $metadata['ref'] ?? null;

        if (is_string($reference)) {
            return $reference;
        }

        // Certains sérialiseurs représentent les métadonnées comme une liste de
        // paires {key, value} plutôt que comme un objet JSON.
        foreach ($metadata as $item) {
            if (is_array($item)
                && in_array($item['key'] ?? null, ['reference', 'ref'], true)
                && is_string($item['value'] ?? null)) {
                return $item['value'];
            }
        }

        return null;
    }

    private function activateSubscription(MonerooPayment $payment): void
    {
        $result = DB::transaction(function () use ($payment) {
            $locked = MonerooPayment::whereKey($payment->id)->lockForUpdate()->first();

            if (! $locked
                || $locked->subscription_activated
                || $locked->status !== 'success'
                || ! $locked->verified_at) {
                return null;
            }

            $user = $locked->user;
            $plan = $locked->plan;
            $months = $locked->billing_cycle === 'yearly' ? 12 : 1;
            $amount = is_numeric($locked->metadata['amount'] ?? null)
                ? (float) $locked->metadata['amount']
                : (float) $locked->amount;

            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'status' => 'active',
                'started_at' => now(),
                'expires_at' => now()->addMonths($months),
                'amount' => $amount,
                'billing_cycle' => $locked->billing_cycle,
                'metadata' => [
                    'payment_method' => 'moneroo',
                    'payment_method_display' => 'Moneroo',
                    'moneroo_payment_id' => $locked->payment_id,
                    'moneroo_reference' => $locked->reference,
                ],
            ]);

            $invoice = SubscriptionInvoice::create([
                'subscription_id' => $subscription->id,
                'user_id' => $user->id,
                'invoice_number' => SubscriptionInvoice::generateInvoiceNumber(),
                'amount' => $amount,
                'tax' => 0,
                'total' => $amount,
                'status' => 'paid',
                'issued_at' => now(),
                'paid_at' => now(),
                'due_at' => now(),
                'payment_method' => 'moneroo',
                'metadata' => [
                    'moneroo_payment_id' => $locked->payment_id,
                    'payment_method_display' => 'Moneroo',
                    'method' => data_get($locked->metadata, 'method.name'),
                    'gateway' => data_get($locked->metadata, 'gateway.name'),
                ],
            ]);

            $locked->update(['subscription_activated' => true]);

            return [$user, $subscription, $invoice];
        });

        if (! $result) {
            return;
        }

        [$user, $subscription, $invoice] = $result;

        try {
            Mail::to($user->email)->send(new SubscriptionInvoiceMail($user, $subscription, $invoice));
        } catch (\Throwable $e) {
            Log::error('SubscriptionInvoiceMail failed', [
                'user' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
