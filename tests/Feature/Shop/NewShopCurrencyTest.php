<?php

namespace Tests\Feature\Shop;

use App\Models\Shop;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A new shop takes the currency the super_admin configured, not the database default.
 *
 * `shops.currency` defaults to MAD in the schema, and the shop creation form sends no
 * currency at all — so every additional shop came out in dirhams whatever the account's
 * country and whatever its owner had set in Settings. Same shape as the hardcoded country
 * fixed in 39302f1.
 */
class NewShopCurrencyTest extends TestCase
{
    use RefreshDatabase;

    private function owner(string $currency, array $settings = []): User
    {
        $shop = Shop::factory()->create(array_merge(['currency' => $currency], $settings));
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => $shop->id]);
        $shop->update(['user_id' => $user->id]);
        $this->subscribeOwnerOf($shop);

        return $user->fresh();
    }

    /**
     * Creating a shop needs an active subscription: the limits middleware refuses before
     * the controller runs, and withoutMiddleware does not exclude it when it carries a
     * route parameter.
     */
    private function subscribe(User $user): void
    {
        $plan = SubscriptionPlan::factory()->create(['max_shops' => 5]);

        Subscription::create([
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'status' => 'active',
            'amount' => 0,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addYear(),
        ]);
    }

    public function test_an_additional_shop_inherits_the_configured_currency(): void
    {
        $user = $this->owner('XOF');

        $this->subscribe($user);

        $this->actingAs($user)
            ->post("/{$user->code_user}/boutiques", ['name' => 'Succursale Yopougon'])
            ->assertSessionHasNoErrors();

        $created = Shop::where('name', 'Succursale Yopougon')->firstOrFail();

        // Et surtout pas MAD, le défaut de la base.
        $this->assertSame('XOF', $created->currency);
    }

    /**
     * Not just the currency: everything the super_admin configured that belongs to the
     * COMPANY rather than to one outlet. The creation form asks for none of them, so they
     * fell back to schema defaults or stayed empty.
     */
    public function test_a_new_shop_inherits_the_accounts_settings(): void
    {
        $user = $this->owner('XOF', [
            'default_tax_rate' => 18,
            'tax_id' => 'CI-1234567',
            'invoice_prefix' => 'QG',
            'invoice_footer' => 'Merci de votre confiance',
            'website' => 'https://quincaillerie-generale.ci',
        ]);

        $this->subscribe($user);

        $this->actingAs($user)
            ->post("/{$user->code_user}/boutiques", ['name' => 'Succursale Yopougon'])
            ->assertSessionHasNoErrors();

        $created = Shop::where('name', 'Succursale Yopougon')->firstOrFail();

        $this->assertSame('XOF', $created->currency);
        // Comparaison numérique : SQLite n'a pas de type décimal et rend « 18 » là où
        // Postgres rend « 18.00 ». C'est la valeur qui est en cause, pas son écriture.
        $this->assertEquals(18, $created->default_tax_rate);
        $this->assertSame('CI-1234567', $created->tax_id);
        $this->assertSame('QG', $created->invoice_prefix);
        $this->assertSame('Merci de votre confiance', $created->invoice_footer);
        $this->assertSame('https://quincaillerie-generale.ci', $created->website);
    }

    /**
     * Inheriting fills the gaps; it never overrides what was typed for this outlet.
     */
    public function test_what_the_form_provides_wins_over_what_is_inherited(): void
    {
        $user = $this->owner('XOF', ['tax_id' => 'CI-1234567']);
        $this->subscribe($user);

        $this->actingAs($user)
            ->post("/{$user->code_user}/boutiques", [
                'name' => 'Succursale Cocody',
                'tax_id' => 'CI-9999999',
                'phone' => '+2250700000000',
            ])
            ->assertSessionHasNoErrors();

        $created = Shop::where('name', 'Succursale Cocody')->firstOrFail();

        $this->assertSame('CI-9999999', $created->tax_id);
        $this->assertSame('+2250700000000', $created->phone);
    }

    /**
     * What identifies the outlet must NOT be copied: a branch has its own address.
     */
    public function test_the_outlets_own_identity_is_not_inherited(): void
    {
        $user = $this->owner('XOF', [
            'address' => 'Cocody Angré',
            'city' => 'Abidjan',
            'phone' => '+2250749992208',
        ]);
        $this->subscribe($user);

        $this->actingAs($user)
            ->post("/{$user->code_user}/boutiques", ['name' => 'Succursale Bouaké'])
            ->assertSessionHasNoErrors();

        $created = Shop::where('name', 'Succursale Bouaké')->firstOrFail();

        $this->assertNull($created->address);
        $this->assertNull($created->city);
        $this->assertNull($created->phone);
    }

    public function test_the_rule_follows_whatever_was_configured(): void
    {
        $user = $this->owner('EUR');

        $this->assertSame('EUR', Shop::defaultCurrencyFor($user));
    }

    /**
     * The user's own shop is the reference, not merely the most recent one on the account
     * — several shops may disagree, and the one they work in is the meaningful answer.
     */
    public function test_the_users_own_shop_wins_over_a_newer_one(): void
    {
        $user = $this->owner('MAD');

        // Une boutique plus récente sur le même compte, dans une autre devise.
        Shop::factory()->create(['user_id' => $user->id, 'currency' => 'USD']);

        $this->assertSame('MAD', Shop::defaultCurrencyFor($user->fresh()));
    }

    /**
     * A brand-new account has nothing to inherit; the fallback applies and stays
     * adjustable in Settings.
     */
    public function test_a_first_shop_falls_back_when_nothing_is_configured(): void
    {
        $user = User::factory()->create(['role' => 'super_admin', 'shop_id' => null]);

        $this->assertSame('USD', Shop::defaultCurrencyFor($user));
    }
}
