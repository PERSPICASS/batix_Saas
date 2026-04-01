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
        $currentSubscription = $user->activeSubscription();

        return Inertia::render('Payment/Checkout', [
            'plan' => [
                'id'                    => $plan->id,
                'name'                  => $plan->name,
                'slug'                  => $plan->slug,
                'description'           => $plan->description,
                'price'                 => $plan->price,
                'price_eur'             => $plan->price_eur,
                'price_fcfa'            => $plan->price_fcfa,
                'max_shops'             => $plan->max_shops,
                'max_users'             => $plan->max_users,
                'max_products'          => $plan->max_products,
                'max_depots'            => $plan->max_depots,
                'has_unlimited_shops'   => $plan->hasUnlimitedShops(),
                'has_unlimited_users'   => $plan->hasUnlimitedUsers(),
                'has_unlimited_products'=> $plan->hasUnlimitedProducts(),
                'has_unlimited_depots'  => $plan->hasUnlimitedDepots(),
            ],
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
     * Traitement du paiement (paiement manuel : virement, mobile money, etc.)
     * En production, intégrer ici Wave, Orange Money, Stripe…
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

        // Plan gratuit → activation directe sans paiement
        if ($plan->price == 0) {
            return $this->activateFree($user, $plan);
        }

        DB::transaction(function () use ($user, $plan, $validated) {
            $months = $validated['billing_cycle'] === 'yearly' ? 12 : 1;
            $amount = $validated['billing_cycle'] === 'yearly'
                ? $plan->price * 12 * 0.85   // -15% annuel
                : $plan->price;

            // Désactiver l'abonnement actuel
            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            // Créer le nouvel abonnement actif immédiatement
            $subscription = Subscription::create([
                'user_id'              => $user->id,
                'subscription_plan_id' => $plan->id,
                'status'               => 'active',
                'started_at'           => now(),
                'expires_at'           => now()->addMonths($months),
                'amount'               => $amount,
                'billing_cycle'        => $validated['billing_cycle'],
                'metadata'             => [
                    'payment_method'  => $validated['payment_method'],
                    'phone'           => $validated['phone'] ?? null,
                    'transaction_ref' => $validated['transaction_ref'] ?? null,
                ],
            ]);

            // Créer la facture marquée comme payée
            SubscriptionInvoice::create([
                'subscription_id'  => $subscription->id,
                'user_id'          => $user->id,
                'invoice_number'   => SubscriptionInvoice::generateInvoiceNumber(),
                'amount'           => $amount,
                'tax'              => 0,
                'total'            => $amount,
                'status'           => 'paid',
                'issued_at'        => now(),
                'paid_at'          => now(),
                'due_at'           => now(),
                'payment_method'   => $validated['payment_method'],
                'metadata'         => [
                    'transaction_ref' => $validated['transaction_ref'] ?? null,
                    'phone'           => $validated['phone'] ?? null,
                ],
            ]);
        });

        return redirect()->route('payment.confirmation', ['planSlug' => $plan->slug])
            ->with('success', 'Votre abonnement ' . $plan->name . ' est maintenant actif !');
    }

    /**
     * Page de confirmation après soumission.
     */
    public function confirmation(Request $request, string $planSlug): Response
    {
        $plan = SubscriptionPlan::where('slug', $planSlug)->firstOrFail();

        return Inertia::render('Payment/Confirmation', [
            'planName' => $plan->name,
            'message'  => $request->session()->get('success'),
        ]);
    }

    /**
     * Activer directement le plan gratuit.
     */
    private function activateFree($user, SubscriptionPlan $plan)
    {
        DB::transaction(function () use ($user, $plan) {
            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

            Subscription::create([
                'user_id'              => $user->id,
                'subscription_plan_id' => $plan->id,
                'status'               => 'active',
                'started_at'           => now(),
                'expires_at'           => null,
                'amount'               => 0,
                'billing_cycle'        => 'monthly',
            ]);
        });

        return redirect()->route('dashboard')
            ->with('success', 'Plan gratuit activé avec succès !');
    }
}
