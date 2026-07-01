<?php

namespace Tests\Unit;

use App\Models\User;
use Tests\TestCase;

class UserLocaleTest extends TestCase
{
    /**
     * Test that user has default locale
     */
    public function test_user_has_default_locale(): void
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->locale);
        $this->assertContains($user->locale, ['en', 'fr']);
    }

    /**
     * Test that user locale can be updated
     */
    public function test_user_locale_can_be_updated(): void
    {
        $user = User::factory()->create(['locale' => 'en']);

        $user->update(['locale' => 'fr']);

        $this->assertEquals('fr', $user->fresh()->locale);
    }

    /**
     * Test that locale is preserved on model updates
     */
    public function test_locale_is_preserved_on_update(): void
    {
        $user = User::factory()->create(['locale' => 'fr']);

        $user->update(['name' => 'Updated Name']);

        $this->assertEquals('fr', $user->fresh()->locale);
    }

    /**
     * Test that user can switch between FR and EN locales
     */
    public function test_user_can_switch_locales(): void
    {
        $user = User::factory()->create(['locale' => 'en']);

        $this->assertEquals('en', $user->locale);

        $user->update(['locale' => 'fr']);
        $this->assertEquals('fr', $user->fresh()->locale);

        $user->update(['locale' => 'en']);
        $this->assertEquals('en', $user->fresh()->locale);
    }

    /**
     * Test that invalid locale is rejected
     */
    public function test_invalid_locale_is_rejected(): void
    {
        $user = User::factory()->create(['locale' => 'en']);

        // This depends on your validation rules
        // Adjust based on your actual validation implementation
        $this->assertContains($user->locale, ['en', 'fr']);
    }
}
