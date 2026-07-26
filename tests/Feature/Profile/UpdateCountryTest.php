<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The account's country must be correctable after registration.
 *
 * It was only ever settable on the signup form: ProfileUpdateRequest validated `name` and
 * `email` only, so a country chosen by mistake was permanent. That mattered because the
 * country seeds every shop created afterwards (ShopController) — and because
 * `shops:sync-country` aligns a shop on its OWNER, it reported "nothing to change" while
 * both sides agreed on the wrong value.
 *
 * @see \Tests\Feature\Onboarding\ShopCountryDefaultTest for the inheritance it feeds.
 */
class UpdateCountryTest extends TestCase
{
    use RefreshDatabase;

    private function owner(?string $country): User
    {
        return User::factory()->create([
            'role' => 'super_admin',
            'country' => $country,
            'email_verified_at' => now(),
        ]);
    }

    /** Every profile route is nested under the account code. */
    private function profileUrl(User $user): string
    {
        return route('profile.edit', ['code_user' => $user->code_user]);
    }

    public function test_the_account_country_can_be_corrected(): void
    {
        $user = $this->owner('Maroc');

        $this->actingAs($user)
            ->patch($this->profileUrl($user), [
                'name' => $user->name,
                'email' => $user->email,
                'country' => "Côte d'Ivoire",
            ])
            ->assertRedirect();

        $this->assertSame("Côte d'Ivoire", $user->fresh()->country);
    }

    public function test_the_edit_page_exposes_the_current_country(): void
    {
        // The country is not in HandleInertiaRequests' shared auth payload, so the form
        // can only pre-select it if the page passes it explicitly.
        $user = $this->owner('Sénégal');

        $this->actingAs($user)
            ->get($this->profileUrl($user))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('country', 'Sénégal'));
    }

    public function test_updating_the_name_alone_does_not_wipe_the_country(): void
    {
        $user = $this->owner('Sénégal');

        // `country` is nullable, and a form that omits it must not blank the column —
        // otherwise any unrelated profile save silently un-sets it.
        $this->actingAs($user)->patch($this->profileUrl($user), [
            'name' => 'Nouveau Nom',
            'email' => $user->email,
        ]);

        $this->assertSame('Nouveau Nom', $user->fresh()->name);
        $this->assertSame('Sénégal', $user->fresh()->country);
    }

    public function test_an_over_long_country_is_rejected(): void
    {
        $user = $this->owner('Sénégal');

        $this->actingAs($user)
            ->patch($this->profileUrl($user), [
                'name' => $user->name,
                'email' => $user->email,
                'country' => str_repeat('a', 101),
            ])
            ->assertSessionHasErrors('country');

        $this->assertSame('Sénégal', $user->fresh()->country);
    }
}
