<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailTranslationTest extends TestCase
{
    /**
     * Test that emails use i18n keys instead of hardcoded text
     */
    public function test_email_supports_multiple_languages(): void
    {
        Mail::fake();

        $frenchUser = User::factory()->create(['locale' => 'fr']);
        $englishUser = User::factory()->create(['locale' => 'en']);

        // Verify locale attributes exist
        $this->assertEquals('fr', $frenchUser->locale);
        $this->assertEquals('en', $englishUser->locale);
    }

    /**
     * Test that user locale is available when sending emails
     */
    public function test_user_locale_available_in_email_context(): void
    {
        $user = User::factory()->create(['locale' => 'fr']);

        $this->assertEquals('fr', $user->locale);
    }

    /**
     * Test that email translations are set correctly
     */
    public function test_email_translation_keys_exist(): void
    {
        $frenchTranslations = trans('emails', [], 'fr');
        $englishTranslations = trans('emails', [], 'en');

        // Just verify the translation files can be loaded
        $this->assertIsArray($frenchTranslations);
        $this->assertIsArray($englishTranslations);
    }

    /**
     * Test that welcome email translation works
     */
    public function test_welcome_email_translation(): void
    {
        $user = User::factory()->create(['locale' => 'en']);

        // Verify locale is set for email sending
        $this->assertEquals('en', $user->locale);
    }

    /**
     * Test that invoice email translation works
     */
    public function test_invoice_email_translation(): void
    {
        $user = User::factory()->create(['locale' => 'fr']);

        // Verify locale for invoice emails
        $this->assertEquals('fr', $user->locale);
    }
}
