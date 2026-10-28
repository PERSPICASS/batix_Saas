<?php

namespace Tests\Feature\User;

use App\Mail\UserInvitationMail;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Le propriétaire ne saisit jamais le mot de passe d'un employé : il l'invite, et l'employé
 * le choisit lui-même depuis un lien personnel, à usage unique, valable 7 jours.
 */
class UserInvitationTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->shop = Shop::factory()->create(['name' => 'Quincaillerie Centrale']);
        $this->owner = User::factory()->create(['role' => 'super_admin', 'shop_id' => $this->shop->id]);
        $this->shop->update(['user_id' => $this->owner->id]);
        $this->subscribeOwnerOf($this->shop);
    }

    /** Crée un employé par l'écran et renvoie le lien émis. */
    private function invite(string $email = 'awa@example.com'): string
    {
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/users", [
            'name' => 'Awa', 'email' => $email, 'role' => 'cashier',
            'shop_id' => $this->shop->id, 'is_active' => true,
        ])->assertSessionHasNoErrors();

        return session('invitationLink')['url'];
    }

    private function accept(string $url, string $password = 'MonMotDePasse1')
    {
        auth()->logout();

        return $this->post($url, ['password' => $password, 'password_confirmation' => $password]);
    }

    public function test_the_employee_is_invited_and_cannot_log_in_before_choosing_a_password(): void
    {
        $url = $this->invite();
        $awa = User::where('email', 'awa@example.com')->sole();

        Mail::assertSent(UserInvitationMail::class, fn ($mail) => $mail->hasTo('awa@example.com') && $mail->url === $url);
        $this->assertTrue($awa->isInvitationPending());
        // Seule l'empreinte est en base : le lien ne s'y lit pas.
        $this->assertStringNotContainsString($awa->invitation_token, $url);

        auth()->logout();
        $this->post('/login', ['email' => 'awa@example.com', 'password' => 'devine123'])
            ->assertSessionHasErrors(['email' => __('auth.invitation.pending_login')]);
        $this->assertGuest();
    }

    public function test_choosing_the_password_logs_the_employee_in_once(): void
    {
        $url = $this->invite();

        $this->get($url)->assertOk()->assertInertia(fn ($page) => $page
            ->component('Auth/AcceptInvitation')
            ->where('valid', true)
            ->where('user.shop', 'Quincaillerie Centrale'));

        $this->accept($url)->assertRedirect(route('dashboard', ['code_user' => $this->owner->code_user]));

        $awa = User::where('email', 'awa@example.com')->sole();
        $this->assertAuthenticatedAs($awa);
        $this->assertTrue(Hash::check('MonMotDePasse1', $awa->password));
        $this->assertFalse($awa->isInvitationPending());
        $this->assertNotNull($awa->email_verified_at);

        // Le lien a servi : il ne fonctionne plus.
        $this->accept($url, 'UnAutreMotDePasse2');
        $this->assertTrue(Hash::check('MonMotDePasse1', $awa->fresh()->password));
        $this->get($url)->assertInertia(fn ($page) => $page->where('valid', false));
    }

    public function test_the_link_expires_after_seven_days(): void
    {
        $url = $this->invite();
        $this->travel(8)->days();

        $this->get($url)->assertInertia(fn ($page) => $page->where('valid', false));
        $this->accept($url);
        $this->assertGuest();
    }

    public function test_a_new_link_cancels_the_previous_one(): void
    {
        $first = $this->invite();
        $awa = User::where('email', 'awa@example.com')->sole();

        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/users/{$awa->id}/invitation-link");
        $second = session('invitationLink')['url'];

        $this->assertNotSame($first, $second);
        $this->accept($first);
        $this->assertGuest();
        $this->accept($second);
        $this->assertAuthenticatedAs($awa->fresh());
    }

    public function test_the_owner_never_sets_an_employees_password(): void
    {
        $this->invite();
        $awa = User::where('email', 'awa@example.com')->sole();
        $hash = $awa->password;

        $this->actingAs($this->owner)->put("/{$this->owner->code_user}/users/{$awa->id}", [
            'name' => 'Awa', 'email' => 'awa@example.com', 'role' => 'cashier', 'shop_id' => $this->shop->id,
            'is_active' => true, 'password' => 'ChoisiParLePatron1', 'password_confirmation' => 'ChoisiParLePatron1',
        ]);

        $this->assertSame($hash, $awa->fresh()->password);
    }

    public function test_an_active_employee_can_be_sent_a_new_password_link(): void
    {
        $this->accept($this->invite());
        $awa = User::where('email', 'awa@example.com')->sole();

        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/users/{$awa->id}/invitation")->assertSessionHas('success');
        $url = session('invitationLink')['url'];
        Mail::assertSent(UserInvitationMail::class, fn ($mail) => !$mail->pending);
        $this->assertFalse($awa->fresh()->isInvitationPending(), 'Un lien de nouveau mot de passe ne remet pas le compte « en attente ».');

        // L'ancien mot de passe reste valable tant que le nouveau n'est pas choisi.
        auth()->logout();
        $this->post('/login', ['email' => 'awa@example.com', 'password' => 'MonMotDePasse1']);
        $this->assertAuthenticatedAs($awa->fresh());

        $this->accept($url, 'NouveauSecret3');
        $this->assertTrue(Hash::check('NouveauSecret3', $awa->fresh()->password));
    }

    public function test_links_are_only_for_the_accounts_own_employees(): void
    {
        $this->invite();
        $awa = User::where('email', 'awa@example.com')->sole();

        $otherShop = Shop::factory()->create();
        $other = User::factory()->create(['role' => 'super_admin', 'shop_id' => $otherShop->id]);
        $otherShop->update(['user_id' => $other->id]);
        $this->subscribeOwnerOf($otherShop);

        $this->actingAs($other)->post("/{$other->code_user}/users/{$awa->id}/invitation-link")->assertForbidden();
        // Ni pour soi-même : le propriétaire a « mot de passe oublié ».
        $this->actingAs($this->owner)->post("/{$this->owner->code_user}/users/{$this->owner->id}/invitation-link")->assertForbidden();
    }

    public function test_forgot_password_also_completes_a_pending_invitation(): void
    {
        $this->invite();
        $awa = User::where('email', 'awa@example.com')->sole();
        $token = \Illuminate\Support\Facades\Password::createToken($awa);

        auth()->logout();
        $this->post('/reset-password', [
            'token' => $token, 'email' => 'awa@example.com',
            'password' => 'ParOubli4xyz', 'password_confirmation' => 'ParOubli4xyz',
        ])->assertSessionHasNoErrors();

        $this->assertFalse($awa->fresh()->isInvitationPending());
    }

    public function test_the_email_renders_in_both_languages(): void
    {
        $this->invite();
        $awa = User::where('email', 'awa@example.com')->sole();

        foreach (['fr' => 'Créer mon mot de passe', 'en' => 'Create my password'] as $locale => $cta) {
            $awa->locale = $locale;
            $html = (new UserInvitationMail($awa, $this->owner, 'https://example.test/invitation/x'))->render();

            $this->assertStringContainsString($cta, $html);
            $this->assertStringContainsString('Quincaillerie Centrale', $html);
            $this->assertStringContainsString('https://example.test/invitation/x', $html);
        }
    }
}
