<?php

namespace Tests\Feature\ActivityLog;

use App\Models\ActivityLog;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le journal survit à la suppression de l'auteur — grâce à l'instantané d'identité.
 *
 * `activity_logs.user_id` est nullable + `set null` depuis la création de la table, mais
 * contrairement à stock_movements (voir StockMovementOrphanedAuthorTest), la table garde une
 * copie de l'identité au moment de l'action : `user_name`, `user_email`, `user_role`. Le
 * contrôleur retombe dessus quand la relation est perdue.
 *
 * Ces colonnes sont elles aussi nullable, et ActivityLogger ne les écrit que s'il y a un
 * utilisateur authentifié : le front doit donc tolérer des champs nuls, pas seulement une
 * relation nulle.
 */
class OrphanedAuthorTest extends TestCase
{
    use RefreshDatabase;

    private function ownerOf(Shop $shop): User
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $shop->update(['user_id' => $user->id]);

        return $user;
    }

    public function test_deleting_the_author_keeps_the_log_and_its_identity_snapshot(): void
    {
        $shop = Shop::factory()->create();
        $owner = $this->ownerOf($shop);
        $employee = User::factory()->create([
            'role' => 'staff',
            'shop_id' => $shop->id,
            'name' => 'Employé Parti',
        ]);

        $log = ActivityLog::create([
            'user_id' => $employee->id,
            'user_name' => $employee->name,
            'user_email' => $employee->email,
            'user_role' => $employee->role,
            'shop_id' => $shop->id,
            'shop_name' => $shop->name,
            'account_code' => $owner->accountCode(),
            'action' => 'update',
        ]);

        $employee->delete();

        // La relation est coupée, l'identité reste : c'est tout l'intérêt de l'instantané.
        $log->refresh();
        $this->assertNull($log->user_id);
        $this->assertNull($log->user);
        $this->assertSame('Employé Parti', $log->user_name);
    }

    public function test_index_falls_back_to_the_snapshot_when_the_author_is_gone(): void
    {
        $shop = Shop::factory()->create();
        $owner = $this->ownerOf($shop);
        $employee = User::factory()->create([
            'role' => 'staff',
            'shop_id' => $shop->id,
            'name' => 'Employé Parti',
        ]);

        ActivityLog::create([
            'user_id' => $employee->id,
            'user_name' => $employee->name,
            'user_email' => $employee->email,
            'user_role' => $employee->role,
            'shop_id' => $shop->id,
            'shop_name' => $shop->name,
            'account_code' => $owner->accountCode(),
            'action' => 'update',
        ]);

        $employee->delete();

        $response = $this->actingAs($owner)->get("/{$owner->code_user}/historique");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('ActivityLogs/Index')
            ->where('activities.data.0.user.name', 'Employé Parti')
        );
    }

    public function test_a_log_written_without_any_authenticated_user_stays_out_of_a_tenants_journal(): void
    {
        // ActivityLogger n'écrit ni l'auteur ni `account_code` sans authentifié. Une telle ligne
        // n'appartient donc à aucun compte, et ne doit pas apparaître chez un locataire — la
        // montrer serait une fuite inter-comptes, pas une amélioration du journal.
        $shop = Shop::factory()->create();
        $owner = $this->ownerOf($shop);

        ActivityLog::create(['action' => 'login_failed']);

        $response = $this->actingAs($owner)->get("/{$owner->code_user}/historique");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('activities.data', []));
    }
}
