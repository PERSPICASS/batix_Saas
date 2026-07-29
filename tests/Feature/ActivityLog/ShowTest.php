<?php

namespace Tests\Feature\ActivityLog;

use App\Models\ActivityLog;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * La page de détail d'un log, enfin joignable.
 *
 * `ActivityLogController::show()` et `ActivityLogs/Show.tsx` existaient depuis toujours sans
 * qu'aucune route ne pointe dessus : du code mort, que la liste annonçait pourtant avec une
 * icône « Voir ». La route est branchée — d'où ces tests, qui couvrent les deux choses qu'une
 * route neuve doit prouver : le modèle se lie vraiment, et la frontière de compte tient.
 *
 * Sur la liaison : le paramètre de route `{activityLog}` doit porter le même nom que l'argument
 * du contrôleur. Sinon Laravel injecte un modèle vide au lieu d'échouer, et le contrôle d'accès
 * compare des valeurs nulles — c'est exactement ce qui était arrivé à stocks.show
 * (StockMovementShowTest).
 */
class ShowTest extends TestCase
{
    use RefreshDatabase;

    private function ownerOf(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop->update(['user_id' => $user->id]);

        return $user;
    }

    private function logFor(User $author, Shop $shop, ?string $accountCode = null): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => $author->id,
            'user_name' => $author->name,
            'user_email' => $author->email,
            'user_role' => $author->role,
            'shop_id' => $shop->id,
            'shop_name' => $shop->name,
            'account_code' => $accountCode ?? $author->accountCode(),
            'action' => 'update',
        ]);
    }

    public function test_owner_can_view_a_log_from_their_account(): void
    {
        $shop = Shop::factory()->create();
        $owner = $this->ownerOf($shop);
        $log = $this->logFor($owner, $shop);

        $response = $this->actingAs($owner)->get("/{$owner->code_user}/historique/{$log->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('ActivityLogs/Show')
            ->where('activity.id', $log->id)
            ->where('activity.user.name', $owner->name)
        );
    }

    public function test_another_accounts_log_is_forbidden(): void
    {
        $shop = Shop::factory()->create();
        $owner = $this->ownerOf($shop);

        $otherShop = Shop::factory()->create();
        $otherOwner = $this->ownerOf($otherShop);
        $foreignLog = $this->logFor($otherOwner, $otherShop);

        $response = $this->actingAs($owner)->get("/{$owner->code_user}/historique/{$foreignLog->id}");

        $response->assertForbidden();
    }

    public function test_a_log_belonging_to_no_account_is_forbidden(): void
    {
        // Écrit sans utilisateur authentifié : `account_code` est nul. La comparaison naïve
        // `null !== $accountCode` aurait suffi à l'ouvrir si accountCode() rendait nul aussi.
        $shop = Shop::factory()->create();
        $owner = $this->ownerOf($shop);
        $orphanLog = ActivityLog::create(['action' => 'login_failed']);

        $response = $this->actingAs($owner)->get("/{$owner->code_user}/historique/{$orphanLog->id}");

        $response->assertForbidden();
    }

    public function test_a_log_whose_author_was_deleted_still_opens(): void
    {
        $shop = Shop::factory()->create();
        $owner = $this->ownerOf($shop);
        $employee = User::factory()->create([
            'role' => 'staff',
            'shop_id' => $shop->id,
            'name' => 'Employé Parti',
        ]);
        $log = $this->logFor($employee, $shop, $owner->accountCode());

        $employee->delete();

        $response = $this->actingAs($owner)->get("/{$owner->code_user}/historique/{$log->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('ActivityLogs/Show')
            ->where('activity.user.name', 'Employé Parti')
        );
    }
}
