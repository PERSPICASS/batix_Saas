<?php

namespace Tests\Feature\Onboarding;

use App\Console\Commands\SendShopReminders;
use App\Mail\ShopReminderMail;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Un inscrit qui ne créait pas sa boutique ne recevait rien : l'essai, et donc ses
 * relances, ne démarre qu'à la création de la boutique.
 */
class ShopReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function signup(int $daysAgo, array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'super_admin', 'shop_id' => null, 'created_at' => now()->subDays($daysAgo),
        ], $attrs));
    }

    private function run_(): void
    {
        $this->artisan('signups:send-shop-reminders')->assertSuccessful();
    }

    public function test_the_steps_and_their_windows(): void
    {
        $this->assertNull(SendShopReminders::dueStep(0));
        $this->assertSame(1, SendShopReminders::dueStep(1));
        $this->assertSame(1, SendShopReminders::dueStep(2));
        $this->assertSame(3, SendShopReminders::dueStep(3));
        $this->assertSame(3, SendShopReminders::dueStep(6));
        $this->assertNull(SendShopReminders::dueStep(7));
    }

    public function test_a_signup_without_shop_is_reminded_once_per_step(): void
    {
        $user = $this->signup(1);

        $this->run_();
        $this->run_();

        Mail::assertSent(ShopReminderMail::class, 1);
        Mail::assertSent(ShopReminderMail::class, fn ($m) => $m->hasTo($user->email) && $m->step === 1);
    }

    public function test_the_second_reminder_goes_on_day_three(): void
    {
        $user = $this->signup(3);

        $this->run_();

        Mail::assertSent(ShopReminderMail::class, fn ($m) => $m->hasTo($user->email) && $m->step === 3);
    }

    public function test_nobody_else_is_written_to(): void
    {
        $this->signup(0); // trop tôt
        $this->signup(12); // trop tard : rien au déploiement
        $this->signup(1, ['email_verified_at' => null]); // adresse jamais confirmée
        $this->signup(1, ['trial_followups_opted_out_at' => now()]); // désinscrit
        $this->signup(1, ['is_demo' => true]);
        $this->signup(1, ['invitation_token' => str_repeat('a', 64)]); // invité, pas prospect
        $this->signup(1, ['role' => 'manager']);
        $withShop = $this->signup(1);
        Shop::factory()->create(['user_id' => $withShop->id]);

        $this->run_();

        Mail::assertNothingSent();
    }

    public function test_the_email_renders_in_both_languages(): void
    {
        foreach (['fr', 'en'] as $locale) {
            $html = (new ShopReminderMail($this->signup(1, ['locale' => $locale]), 3))->render();

            $this->assertStringContainsString('/create-shop', $html);
            $this->assertStringNotContainsString('mail.shop_reminder', $html);
        }
    }
}
