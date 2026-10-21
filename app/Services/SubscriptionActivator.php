<?php

namespace App\Services;

use App\Mail\SubscriptionInvoiceMail;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Support\ConcurrencySafe;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Seul endroit qui transforme un paiement confirmé en abonnement actif.
 *
 * Chaque fournisseur avait sa propre copie de cette logique, et elles avaient
 * divergé : payer en avance faisait repartir l'abonnement d'aujourd'hui (les jours
 * déjà payés étaient perdus), l'essai en cours restait ouvert à côté de
 * l'abonnement payant, et la garde anti-doublon de Paddle tournait hors verrou.
 */
class SubscriptionActivator
{
    /**
     * Crée l'abonnement payé et sa facture, puis envoie la facture par email.
     *
     * $claim tourne dans la transaction, une fois le compte verrouillé : il renvoie
     * false si ce paiement a déjà été traité (webhook rejoué, retour navigateur et
     * Pulse simultanés). Tout ce qu'il écrit est annulé avec le reste en cas d'échec.
     *
     * @return array{0: Subscription, 1: SubscriptionInvoice}|null null si déjà traité
     */
    public function activatePaid(
        User $user,
        SubscriptionPlan $plan,
        string $billingCycle,
        float $amount,
        string $paymentMethod,
        array $subscriptionMetadata = [],
        array $invoiceMetadata = [],
        ?Closure $claim = null,
    ): ?array {
        // Le numéro de facture peut entrer en collision : on rejoue la transaction
        // entière (sous Postgres, une violation attrapée à l'intérieur l'empoisonne).
        $result = ConcurrencySafe::retryOnDuplicate(fn () => DB::transaction(function () use (
            $user, $plan, $billingCycle, $amount, $paymentMethod, $subscriptionMetadata, $invoiceMetadata, $claim
        ) {
            $this->lockAccount($user->id);

            if ($claim && $claim() === false) {
                return null;
            }

            $months = $billingCycle === 'yearly' ? 12 : 1;
            $expiresAt = $this->paidUntil($user->id)->addMonths($months);

            $this->closeCurrent($user->id);

            $subscription = Subscription::create([
                'user_id'              => $user->id,
                'subscription_plan_id' => $plan->id,
                'status'               => 'active',
                'started_at'           => now(),
                'expires_at'           => $expiresAt,
                'amount'               => $amount,
                'billing_cycle'        => $billingCycle,
                'metadata'             => ['payment_method' => $paymentMethod] + $subscriptionMetadata,
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
                'payment_method'  => $paymentMethod,
                'metadata'        => $invoiceMetadata,
            ]);

            return [$subscription, $invoice];
        }));

        if ($result) {
            $this->sendInvoice($user, ...$result);
        }

        return $result;
    }

    /**
     * Active une demande en attente (paiement manuel confirmé par l'admin) et marque
     * ses factures payées.
     */
    public function activatePending(Subscription $subscription): void
    {
        DB::transaction(function () use ($subscription) {
            $this->lockAccount($subscription->user_id);

            $months = $subscription->billing_cycle === 'yearly' ? 12 : 1;

            // Une date de fin déjà posée et à venir est respectée ; sinon on part de la
            // fin de ce qui est déjà payé — jamais du passé, une demande pouvant
            // attendre des semaines.
            $expiresAt = $subscription->expires_at && $subscription->expires_at->isFuture()
                ? $subscription->expires_at
                : $this->paidUntil($subscription->user_id, $subscription->id)->addMonths($months);

            $this->closeCurrent($subscription->user_id, $subscription->id);

            $subscription->update([
                'status'       => 'active',
                'started_at'   => $subscription->started_at ?? now(),
                'expires_at'   => $expiresAt,
                'cancelled_at' => null,
            ]);

            $subscription->invoices()->where('status', 'pending')->update([
                'status'  => 'paid',
                'paid_at' => now(),
            ]);
        });

        $invoice = $subscription->invoices()->latest()->first();

        if ($invoice) {
            $this->sendInvoice($subscription->user, $subscription->fresh(), $invoice);
        }
    }

    /**
     * Sérialise les activations d'un même compte : deux paiements simultanés
     * calculeraient sinon la même date de fin et ouvriraient deux abonnements.
     */
    private function lockAccount(int $userId): void
    {
        User::whereKey($userId)->lockForUpdate()->first();
    }

    /**
     * Point de départ du nouvel abonnement : la fin de l'abonnement payé en cours
     * s'il court encore, sinon maintenant. L'essai gratuit n'est pas reporté —
     * le prolonger revenait à l'offrir deux fois.
     */
    private function paidUntil(int $userId, ?int $exceptId = null): CarbonInterface
    {
        $end = Subscription::where('user_id', $userId)
            ->where('status', 'active')
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->where('expires_at', '>', now())
            ->max('expires_at');

        return $end ? Carbon::parse($end) : now();
    }

    /** Un seul abonnement ouvert à la fois : l'actif et l'essai en cours sont clos. */
    private function closeCurrent(int $userId, ?int $exceptId = null): void
    {
        Subscription::where('user_id', $userId)
            ->whereIn('status', ['active', 'trial'])
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->update(['status' => 'cancelled', 'cancelled_at' => now()]);
    }

    private function sendInvoice(User $user, Subscription $subscription, SubscriptionInvoice $invoice): void
    {
        try {
            Mail::to($user->email)->send(new SubscriptionInvoiceMail($user, $subscription, $invoice));
        } catch (\Throwable $e) {
            Log::error('SubscriptionInvoiceMail failed', ['user' => $user->id, 'error' => $e->getMessage()]);
        }
    }
}
