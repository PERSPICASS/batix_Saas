<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Page de checkout pour un plan donné.
     */
    public function checkout(SubscriptionPlan $plan): Response
    {
        abort_if(!$plan->is_active, 404);

        $user = Auth::user();
        abort_if($user->role !== 'super_admin', 403, "Seul le propriétaire du compte peut gérer l'abonnement.");
        $currentSubscription = $user->activeSubscription();

        // Devise de la boutique active de l'utilisateur
        $shop = $user->shop ?? \App\Models\Shop::where('user_id', $user->id)->first();
        $currency = $shop?->currency ?? 'XOF';

        return Inertia::render('Payment/Checkout', [
            'plan' => [
                'id'                    => $plan->id,
                'name'                  => $plan->name,
                'slug'                  => $plan->slug,
                'description'           => $plan->description,
                'price'                 => $plan->price,
                'price_eur'             => $plan->price_eur,
                'max_shops'             => $plan->max_shops,
                'max_users'             => $plan->max_users,
                'max_products'          => $plan->max_products,
                'max_depots'            => $plan->max_depots,
                'has_unlimited_shops'   => $plan->hasUnlimitedShops(),
                'has_unlimited_users'   => $plan->hasUnlimitedUsers(),
                'has_unlimited_products'=> $plan->hasUnlimitedProducts(),
                'has_unlimited_depots'  => $plan->hasUnlimitedDepots(),
            ],
            'currency'  => $currency,
            'isSandbox' => (bool) config('services.pawapay.sandbox', true),
            // Le bouton Mobile Money reste visible, mais inactif tant que le lancement
            // commercial n'est pas explicitement autorisé par MONEROO_ENABLED.
            // Le détail de ce qui manque ne sort qu'en debug : en production, un client
            // n'a pas à lire notre configuration.
            'monerooEnabled' => (bool) config('services.moneroo.enabled', false)
                && config('services.moneroo.api_key', '') !== ''
                && config('services.moneroo.webhook_secret', '') !== '',
            'userCountry'  => $user->country,
            'monerooSetup' => config('app.debug') ? array_values(array_filter([
                config('services.moneroo.api_key', '') === '' ? 'MONEROO_API_KEY absent de .env' : null,
                config('services.moneroo.webhook_secret', '') === '' ? 'MONEROO_WEBHOOK_SECRET absent de .env' : null,
            ])) : null,
            'currentPlan' => $currentSubscription ? [
                'name' => $currentSubscription->plan->name,
                'slug' => $currentSubscription->plan->slug,
            ] : null,
            'paymentNumbers' => [
                'wave'         => PlatformSetting::get('payment_wave',         config('services.payment.wave', '')),
                'orange_money' => PlatformSetting::get('payment_orange_money', config('services.payment.orange_money', '')),
                'mtn_money'    => PlatformSetting::get('payment_mtn_money',    config('services.payment.mtn_money', '')),
                'moov_money'   => PlatformSetting::get('payment_moov_money',   config('services.payment.moov_money', '')),
                'virement'     => PlatformSetting::get('payment_virement',     config('services.payment.virement', '')),
                'carte'        => PlatformSetting::get('payment_carte',        config('services.payment.carte', '')),
            ],
        ]);
    }

    /**
     * Soumission d'un paiement manuel (virement, mobile money, etc.) déclaré par l'utilisateur.
     * Ces méthodes ne sont pas vérifiables automatiquement : la souscription reste "pending"
     * tant qu'un administrateur n'a pas confirmé la réception du paiement (voir
     * PlatformAdminController::activateSubscription).
     */
    public function process(Request $request, SubscriptionPlan $plan)
    {
        abort_if(!$plan->is_active, 404);

        $validated = $request->validate([
            'payment_method'    => 'required|in:wave,orange_money,mtn_money,moov_money,virement,carte',
            'billing_cycle'     => 'required|in:monthly,yearly',
            'phone'             => 'nullable|string|max:20',
            'transaction_ref'   => 'nullable|string|max:100',
        ]);

        $user = Auth::user();
        abort_if($user->role !== 'super_admin', 403, "Seul le propriétaire du compte peut gérer l'abonnement.");

        // Plan gratuit → activation directe sans paiement
        if ($plan->price == 0) {
            return $this->activateFree($user, $plan);
        }

        $mobileMoneyMethods = ['wave', 'orange_money', 'mtn_money', 'moov_money'];

        if (! config('services.moneroo.enabled', false)
            && in_array($validated['payment_method'], $mobileMoneyMethods, true)) {
            return response()->json([
                'message' => 'Le paiement par Mobile Money sera bientôt actif.',
            ], 503);
        }

        DB::transaction(function () use ($user, $plan, $validated) {
            $amount = $validated['billing_cycle'] === 'yearly'
                ? $plan->price * 10
                : $plan->price;

            $subscription = Subscription::create([
                'user_id'              => $user->id,
                'subscription_plan_id' => $plan->id,
                'status'               => 'pending',
                'started_at'           => null,
                'expires_at'           => null,
                'amount'               => $amount,
                'billing_cycle'        => $validated['billing_cycle'],
                'metadata'             => [
                    'payment_method'  => $validated['payment_method'],
                    'phone'           => $validated['phone'] ?? null,
                    'transaction_ref' => $validated['transaction_ref'] ?? null,
                ],
            ]);

            SubscriptionInvoice::create([
                'subscription_id'  => $subscription->id,
                'user_id'          => $user->id,
                'invoice_number'   => SubscriptionInvoice::generateInvoiceNumber(),
                'amount'           => $amount,
                'tax'              => 0,
                'total'            => $amount,
                'status'           => 'pending',
                'issued_at'        => now(),
                'paid_at'          => null,
                'due_at'           => now()->addDays(3),
                'payment_method'   => $validated['payment_method'],
                'metadata'         => [
                    'transaction_ref' => $validated['transaction_ref'] ?? null,
                    'phone'           => $validated['phone'] ?? null,
                ],
            ]);
        });

        return redirect()->route('payment.confirmation', [
            'planSlug' => $plan->slug,
            'status'   => 'pending',
        ]);
    }

    /**
     * Page de confirmation après soumission.
     */
    public function confirmation(Request $request, string $planSlug): Response
    {
        $plan = SubscriptionPlan::where('slug', $planSlug)->firstOrFail();

        return Inertia::render('Payment/Confirmation', [
            'planName' => $plan->name,
            'message'  => null,
            'status'   => $request->query('status') === 'pending' ? 'pending' : 'confirmed',
        ]);
    }

    /**
     * Activer directement le plan gratuit.
     */
    /**
     * Le plan gratuit est un ESSAI, pas une offre perpétuelle : c'est le même plan que
     * celui octroyé à la création de la première boutique (ShopController::store), pour
     * la même durée.
     *
     * Il était créé ici avec `expires_at = null`, or activeSubscription() lit une date
     * nulle comme « n'expire jamais ». Tout compte passé par ce bouton devenait donc
     * immunisé à vie : ni rappel d'expiration, ni passage en lecture seule, quelle que
     * soit l'ancienneté de son essai. Et comme le bouton restait cliquable, un essai
     * épuisé se relançait indéfiniment — d'où le refus explicite ci-dessous.
     */
    private const FREE_TRIAL_DAYS = 14;

    private function activateFree($user, SubscriptionPlan $plan)
    {
        $alreadyUsed = Subscription::where('user_id', $user->id)
            ->where('subscription_plan_id', $plan->id)
            ->exists();

        if ($alreadyUsed) {
            return redirect()->route('plans.index')
                ->with('error', 'Votre essai gratuit a déjà été utilisé. Choisissez une offre payante pour continuer.');
        }

        DB::transaction(function () use ($user, $plan) {
            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            Subscription::create([
                'user_id'              => $user->id,
                'subscription_plan_id' => $plan->id,
                'status'               => 'trial',
                'started_at'           => now(),
                'expires_at'           => now()->addDays(self::FREE_TRIAL_DAYS),
                'trial_ends_at'        => now()->addDays(self::FREE_TRIAL_DAYS),
                'amount'               => 0,
                'billing_cycle'        => 'monthly',
            ]);
        });

        return redirect()->route('dashboard',  ['code_user' => $user->code_user])
            ->with('success', 'Plan gratuit activé avec succès !');
    }
}
