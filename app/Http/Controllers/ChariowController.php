<?php

namespace App\Http\Controllers;

use App\Mail\SubscriptionInvoiceMail;
use App\Models\ChariowCheckout;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Services\ChariowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ChariowController extends Controller
{
    public function __construct(private ChariowService $chariow) {}

    /**
     * Ouvre une session de paiement Chariow pour un plan.
     */
    public function initiate(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        abort_if(!$plan->is_active, 404);

        $validated = $request->validate([
            'billing_cycle'      => 'required|in:monthly,yearly',
            'first_name'         => 'required|string|max:50',
            'last_name'          => 'required|string|max:50',
            'phone_number'       => 'required|string|max:20|regex:/^[0-9]+$/',
            'phone_country_code' => 'required|string|size:2|alpha',
        ]);

        $user = Auth::user();
        abort_if($user->role !== 'super_admin', 403, "Seul le propriétaire du compte peut gérer l'abonnement.");

        if (!$this->chariow->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => "Le paiement Chariow n'est pas encore configuré.",
            ], 422);
        }

        $productId = $validated['billing_cycle'] === 'yearly'
            ? $plan->chariow_product_id_yearly
            : $plan->chariow_product_id;

        if (!$productId) {
            Log::warning('Chariow: produit non mappé', [
                'plan'  => $plan->slug,
                'cycle' => $validated['billing_cycle'],
            ]);

            return response()->json([
                'success' => false,
                'message' => "Ce plan n'est pas encore disponible via Chariow.",
            ], 422);
        }

        // Annuel = 10 mois payés (2 offerts), même règle que le paiement manuel et Jèko.
        $amount = $validated['billing_cycle'] === 'yearly'
            ? round((float) $plan->price * 10, 2)
            : round((float) $plan->price, 2);

        $reference = 'BTX-' . $user->id . '-' . $plan->id . '-' . Str::random(8);

        // La ligne est créée AVANT l'appel réseau : c'est elle qui fait autorité au
        // retour du webhook (utilisateur, plan, cycle, montant attendu). Le payload
        // Chariow ne sert qu'à la retrouver, jamais à décider ce qu'on active.
        $checkout = ChariowCheckout::create([
            'reference'            => $reference,
            'user_id'              => $user->id,
            'subscription_plan_id' => $plan->id,
            'billing_cycle'        => $validated['billing_cycle'],
            'status'               => 'pending',
            'chariow_product_id'   => $productId,
            'amount'               => $amount,
            'currency'             => 'XOF',
        ]);

        $result = $this->chariow->createCheckout([
            'product_id'  => $productId,
            'email'       => $user->email,
            'first_name'  => $validated['first_name'],
            'last_name'   => $validated['last_name'],
            'phone'       => [
                'number'       => $validated['phone_number'],
                'country_code' => strtoupper($validated['phone_country_code']),
            ],
            'customer_ip'     => $request->ip(),
            'redirect_url'    => route('chariow.return', ['ref' => $reference]),
            'custom_metadata' => [
                'ref'     => $reference,
                'user_id' => (string) $user->id,
                'plan_id' => (string) $plan->id,
                'cycle'   => $validated['billing_cycle'],
            ],
        ]);

        if (!$result['ok'] || empty($result['checkout_url'])) {
            $checkout->update([
                'status'   => 'failed',
                'metadata' => $result['raw'] ?? null,
            ]);

            // `already_purchased` signale presque toujours une erreur de configuration,
            // pas une erreur de l'utilisateur : Chariow ne bloque le rachat que pour les
            // types Downloadable / Course / Bundle. Un plan d'abonnement doit être créé
            // en type « License », le seul qui autorise les achats répétés — sinon tout
            // renouvellement est refusé, un mois après la mise en service.
            if (($result['step'] ?? null) === 'already_purchased') {
                Log::error('Chariow: rachat refusé — le produit n\'est probablement pas de type License', [
                    'plan'       => $plan->slug,
                    'product_id' => $productId,
                    'user_id'    => $user->id,
                ]);
            }

            $message = ($result['step'] ?? null) === 'already_purchased'
                ? "Ce plan ne peut pas être racheté avec cet email. Notre équipe a été prévenue — contactez le support."
                : ($result['message'] ?? "Échec de l'ouverture du paiement. Veuillez réessayer.");

            return response()->json(['success' => false, 'message' => $message], 422);
        }

        $checkout->update([
            'sale_id'        => $result['sale_id'] ?? null,
            'transaction_id' => $result['transaction_id'] ?? null,
            'checkout_url'   => $result['checkout_url'],
            'metadata'       => $result['raw'] ?? null,
        ]);

        return response()->json([
            'success'     => true,
            'redirectUrl' => $result['checkout_url'],
        ]);
    }

    /**
     * Retour du client après paiement (redirect_url).
     *
     * Le webhook reste la source de vérité ; cette page ne fait que rattraper le
     * cas où le client revient avant que le Pulse ne soit arrivé.
     */
    public function return(Request $request): RedirectResponse
    {
        $reference = $request->query('ref');

        // La référence circule dans une URL de redirection publique : on la borne au
        // compte connecté pour qu'elle ne serve pas de sonde sur les paiements d'autrui.
        $checkout = $reference
            ? ChariowCheckout::where('reference', $reference)
                ->where('user_id', Auth::id())
                ->first()
            : null;

        if (!$checkout) {
            return redirect('/plans')->with('error', 'Paiement introuvable.');
        }

        if (!$checkout->subscription_activated && $checkout->sale_id) {
            $sale = $this->chariow->getSale($checkout->sale_id);

            if (($sale['status'] ?? null) === 'completed') {
                $this->markCompleted($checkout, $sale);
                $checkout->refresh();
            }
        }

        if ($checkout->subscription_activated) {
            return redirect('/' . $checkout->user->accountCode() . '/dashboard')
                ->with('success', 'Paiement confirmé et abonnement activé !');
        }

        // Paiement mobile money : la confirmation opérateur peut prendre quelques
        // instants, on ne présente donc pas ça comme un échec.
        return redirect('/plans')->with('info', "Paiement en cours de confirmation. Votre abonnement sera activé dès réception.");
    }

    /**
     * Webhook Chariow (« Pulse »).
     */
    public function webhook(Request $request): JsonResponse
    {
        // Le corps brut, avant tout parsing : seul lui est signé.
        $rawBody   = $request->getContent();
        $signature = $request->header('x-chariow-signature');

        if (!$this->chariow->verifyPulseSignature($rawBody, $signature)) {
            Log::warning('Chariow: signature de Pulse invalide');

            return response()->json(['ok' => false], 401);
        }

        $deliveryId = $request->header('x-pulse-delivery-id');
        $event      = $request->header('x-pulse-event') ?? $request->input('event');

        // Déduplication sur l'id de livraison, stable à travers les retries. L'insert
        // est la garde elle-même : deux livraisons simultanées ne peuvent pas passer
        // toutes les deux la contrainte d'unicité.
        if ($deliveryId) {
            try {
                DB::table('chariow_pulse_deliveries')->insert([
                    'delivery_id'  => $deliveryId,
                    'event'        => $event,
                    'processed_at' => now(),
                ]);
            } catch (\Illuminate\Database\UniqueConstraintViolationException) {
                return response()->json(['ok' => true, 'duplicate' => true]);
            }
        }

        $payload   = $request->json()->all();
        $reference = $payload['sale']['custom_metadata']['ref'] ?? null;

        Log::info('Chariow Pulse reçu', [
            'event'     => $event,
            'sale_id'   => $payload['sale']['id'] ?? null,
            'reference' => $reference,
        ]);

        if (!$reference) {
            // Vente faite hors de l'app (boutique Chariow directe) : rien à activer.
            return response()->json(['ok' => true]);
        }

        $checkout = ChariowCheckout::where('reference', $reference)->first();

        if (!$checkout) {
            return response()->json(['ok' => true]);
        }

        match ($event) {
            'successful.sale' => $this->markCompleted($checkout, $payload['sale'] ?? []),
            'failed.sale'     => $checkout->update(['status' => 'failed', 'metadata' => $payload, 'completed_at' => now()]),
            'abandoned.sale'  => $checkout->update(['status' => 'abandoned', 'metadata' => $payload]),
            default           => null,
        };

        return response()->json(['ok' => true]);
    }

    /**
     * Enregistre la vente et active l'abonnement.
     */
    private function markCompleted(ChariowCheckout $checkout, array $sale): void
    {
        $paid     = isset($sale['amount']['value']) ? (float) $sale['amount']['value'] : null;
        $currency = $sale['amount']['currency'] ?? null;
        $expected = (float) $checkout->amount;

        // Garde-fou sur un produit Chariow mal tarifé côté tableau de bord : on ne
        // débloque pas un plan à 15 000 XOF pour une vente encaissée à 500. La
        // comparaison n'a de sens qu'à devise égale — si Chariow a converti, c'est
        // son taux qui fait foi et on laisse passer en le signalant.
        if ($paid !== null && $currency === $checkout->currency && $paid + 0.01 < $expected) {
            Log::error('Chariow: montant encaissé inférieur au prix du plan, activation refusée', [
                'reference' => $checkout->reference,
                'paid'      => $paid,
                'expected'  => $expected,
                'currency'  => $currency,
            ]);

            $checkout->update([
                'status'       => 'completed',
                'sale_id'      => $sale['id'] ?? $checkout->sale_id,
                'metadata'     => $sale,
                'completed_at' => now(),
            ]);

            return;
        }

        if ($paid !== null && $currency !== null && $currency !== $checkout->currency) {
            Log::warning('Chariow: vente encaissée dans une autre devise', [
                'reference' => $checkout->reference,
                'paid'      => $paid,
                'currency'  => $currency,
                'expected'  => $expected . ' ' . $checkout->currency,
            ]);
        }

        $checkout->update([
            'status'       => 'completed',
            'sale_id'      => $sale['id'] ?? $checkout->sale_id,
            'metadata'     => $sale,
            'completed_at' => now(),
        ]);

        $this->activateSubscription($checkout);
    }

    /**
     * Crée l'abonnement et sa facture après paiement confirmé.
     */
    private function activateSubscription(ChariowCheckout $checkout): void
    {
        // Verrou + re-vérification du flag dans la transaction : le webhook et le
        // retour navigateur peuvent arriver en même temps, et sans ce verrou les deux
        // passeraient le test avant que l'un persiste le flag — deux abonnements et
        // deux factures pour un seul paiement.
        $result = DB::transaction(function () use ($checkout) {
            $locked = ChariowCheckout::where('id', $checkout->id)->lockForUpdate()->first();

            if (!$locked || $locked->subscription_activated) {
                return null;
            }

            $user   = $locked->user;
            $plan   = $locked->plan;
            $months = $locked->billing_cycle === 'yearly' ? 12 : 1;
            $amount = (float) $locked->amount;

            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            $subscription = Subscription::create([
                'user_id'              => $user->id,
                'subscription_plan_id' => $plan->id,
                'status'               => 'active',
                'started_at'           => now(),
                'expires_at'           => now()->addMonths($months),
                'amount'               => $amount,
                'billing_cycle'        => $locked->billing_cycle,
                'metadata'             => [
                    'payment_method'         => 'chariow',
                    'payment_method_display' => 'Chariow',
                    'chariow_sale_id'        => $locked->sale_id,
                    'chariow_reference'      => $locked->reference,
                ],
            ]);

            $invoice = SubscriptionInvoice::create([
                'subscription_id' => $subscription->id,
                'user_id'         => $user->id,
                'invoice_number'  => SubscriptionInvoice::generateInvoiceNumber(),
                'amount'          => $amount,
                'tax'             => 0,
                'total'           => $amount,
                'status'          => 'paid',
                'issued_at'       => now(),
                'paid_at'         => now(),
                'due_at'          => now(),
                'payment_method'  => 'chariow',
                'metadata'        => [
                    'chariow_sale_id'        => $locked->sale_id,
                    'payment_method_display' => 'Chariow',
                ],
            ]);

            $locked->update(['subscription_activated' => true]);

            return [$user, $subscription, $invoice];
        });

        if (!$result) {
            return;
        }

        [$user, $subscription, $invoice] = $result;

        try {
            Mail::to($user->email)->send(new SubscriptionInvoiceMail($user, $subscription, $invoice));
        } catch (\Throwable $e) {
            Log::error('SubscriptionInvoiceMail failed', ['user' => $user->id, 'error' => $e->getMessage()]);
        }
    }
}
