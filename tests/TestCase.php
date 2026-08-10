<?php

namespace Tests;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Donne au propriétaire actuel de la boutique un abonnement actif et sans limite.
     *
     * En production, un compte a toujours un plan : créer sa première boutique octroie
     * l'essai gratuit (ShopController::store). Une boutique dont le propriétaire n'a
     * aucun abonnement est donc un état qui n'existe pas — et depuis
     * EnforceSubscriptionReadOnly, un tel compte est (à raison) en lecture seule, ce qui
     * ferait échouer toute écriture du test pour une raison sans rapport avec lui.
     *
     * À appeler après avoir réaffecté `user_id`, puisque c'est le propriétaire final qui
     * porte l'abonnement. Les tests qui portent justement sur les quotas ou l'expiration
     * créent leur propre abonnement et n'utilisent pas ce raccourci.
     */
    protected function subscribeOwnerOf(Shop $shop): void
    {
        $this->subscribeAccount($shop->fresh()->user_id);
    }

    /** Même chose pour un compte sans boutique (isolation entre locataires, permissions…). */
    protected function subscribeAccount(int $ownerId): void
    {
        Subscription::firstOrCreate(
            ['user_id' => $ownerId],
            [
                'subscription_plan_id' => SubscriptionPlan::factory()->create([
                    'max_shops'    => -1,
                    'max_users'    => -1,
                    'max_products' => -1,
                    'max_depots'   => -1,
                ])->id,
                'status'     => 'active',
                'started_at' => now(),
                'expires_at' => now()->addYear(),
                'amount'     => 0,
            ]
        );
    }
}
