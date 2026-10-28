<?php

namespace Tests\Feature\Errors;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Les pages d'erreur disent ce qui s'est passé et comment en sortir — avant, un vendeur
 * sans droit voyait « 403 | VOUS N'AVEZ PAS LA PERMISSION… » sur fond blanc, sans lien.
 */
class ErrorPagesTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shop = Shop::factory()->create();
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id, 'locale' => 'fr']);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    private function cashier(string $locale): User
    {
        return User::factory()->create(['role' => 'cashier', 'shop_id' => $this->shop->id, 'locale' => $locale]);
    }

    public function test_a_missing_permission_names_the_right_and_who_can_grant_it(): void
    {
        $response = $this->actingAs($this->cashier('fr'))->get("/{$this->owner->code_user}/parametres");

        $response->assertForbidden()
            ->assertSee('Accès refusé')
            ->assertSee("Vous n'avez pas le droit de consulter : Paramètres.")
            ->assertSee("demandez à l'administrateur du compte")
            ->assertSee(route('dashboard', ['code_user' => $this->owner->code_user]), false)
            ->assertSee('Tableau de bord');
    }

    public function test_the_refusal_follows_the_users_language(): void
    {
        $this->actingAs($this->cashier('en'))->get("/{$this->owner->code_user}/parametres")
            ->assertForbidden()
            ->assertSee('Access denied')
            ->assertSee('You do not have the right to view: Settings.');
    }

    public function test_a_missing_page_offers_a_way_back(): void
    {
        app()->setLocale('fr');

        $this->get('/cette-page-n-existe-pas/vraiment')
            ->assertNotFound()
            ->assertSee('Page introuvable')
            ->assertSee("Retour à l'accueil");
    }
}
