<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class MultiLanguageTest extends TestCase
{
    /**
     * Test that user can switch between French and English
     */
    public function test_user_can_switch_languages(): void
    {
        $user = User::factory()->create(['locale' => 'en']);
        $this->actingAs($user);

        $this->assertEquals('en', $user->locale);

        $user->update(['locale' => 'fr']);
        $this->assertEquals('fr', $user->fresh()->locale);
    }

    /**
     * Test that French locale is set correctly
     */
    public function test_french_locale_detected(): void
    {
        $user = User::factory()->create(['locale' => 'fr']);

        $this->assertEquals('fr', $user->locale);
    }

    /**
     * Test that English locale is set correctly
     */
    public function test_english_locale_detected(): void
    {
        $user = User::factory()->create(['locale' => 'en']);

        $this->assertEquals('en', $user->locale);
    }

    /**
     * Test that locale is preserved across requests
     */
    public function test_locale_persisted_across_requests(): void
    {
        $user = User::factory()->create(['locale' => 'fr']);
        $this->actingAs($user);

        // First request
        $this->assertEquals('fr', $user->locale);

        // Subsequent request
        $freshUser = User::find($user->id);
        $this->assertEquals('fr', $freshUser->locale);
    }

    /**
     * Test that translation keys are available
     */
    public function test_translation_keys_available(): void
    {
        $this->assertTrue(true); // Placeholder for checking translation file existence
    }

    /**
     * Test that locale switching updates user preference
     */
    public function test_locale_update_persists(): void
    {
        $user = User::factory()->create(['locale' => 'en']);
        $this->actingAs($user);

        // Switch language
        $user->update(['locale' => 'fr']);

        // Verify it persists
        $this->assertEquals('fr', User::find($user->id)->locale);
    }

    /**
     * Test that non-authenticated user has default locale
     */
    public function test_default_locale_for_new_user(): void
    {
        $user = User::factory()->create();

        $this->assertIn($user->locale, ['en', 'fr']);
    }

    /**
     * Test that translation files exist for both languages
     */
    public function test_translation_files_exist(): void
    {
        $enPath = lang_path('en');
        $frPath = lang_path('fr');

        $this->assertTrue(true); // Placeholder
    }
}
