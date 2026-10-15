<?php

namespace Tests\Feature\Subscription;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * activeSubscription() était recalculé une douzaine de fois par page (props
 * partagées, garde lecture seule, quotas…) : 12 requêtes identiques + 9
 * chargements du plan, sur chaque page de l'application.
 */
class ActiveSubscriptionMemoTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_page_looks_the_subscription_up_once(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        $shop = Shop::factory()->create(['user_id' => $owner->id]);
        $owner->update(['shop_id' => $shop->id]);

        $lookups = 0;
        DB::listen(function ($query) use (&$lookups) {
            if (str_contains($query->sql, 'from "subscriptions"')) {
                $lookups++;
            }
        });

        $this->actingAs($owner->fresh())->get('/'.$owner->accountCode().'/clients')->assertOk();

        $this->assertSame(1, $lookups);
    }

    public function test_a_change_within_the_request_is_seen_immediately(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin']);
        Shop::factory()->create(['user_id' => $owner->id]); // crée un abonnement actif

        $this->assertNotNull($owner->activeSubscription());

        Subscription::where('user_id', $owner->id)->first()->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        $this->assertNull($owner->activeSubscription(), 'Le cache de la requête doit être vidé quand un abonnement change.');
    }
}
