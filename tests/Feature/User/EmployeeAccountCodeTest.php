<?php

namespace Tests\Feature\User;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Un employé a son propre code_user, mais les pages du compte vivent sous le code du
 * propriétaire : une adresse bâtie sur le code de l'employé répond 404. Vu en prod sur la
 * page de connexion (employé déjà connecté) et le bloc « Bien démarrer » du tableau de bord.
 */
class EmployeeAccountCodeTest extends TestCase
{
    use RefreshDatabase;

    private function employee(): array
    {
        $shop = Shop::factory()->create();
        $owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $owner->id]);
        $this->subscribeOwnerOf($shop);
        $manager = User::factory()->create(['role' => 'manager', 'shop_id' => $shop->id]);

        return [$owner, $manager];
    }

    public function test_a_logged_in_employee_sent_to_login_lands_on_the_account_dashboard(): void
    {
        [$owner, $manager] = $this->employee();

        $this->assertNotSame($owner->code_user, $manager->code_user);
        $this->actingAs($manager)->get('/login')
            ->assertRedirect(route('dashboard', ['code_user' => $owner->code_user]));
    }

    public function test_the_dashboard_shares_the_account_code_with_an_employee(): void
    {
        [$owner, $manager] = $this->employee();

        $this->actingAs($manager)->get("/{$owner->code_user}/dashboard")
            ->assertInertia(fn ($page) => $page->where('routeParams.code_user', $owner->code_user));
    }
}
