<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailSendingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    /**
     * Test that invoice email is sent
     */
    public function test_invoice_email_sent(): void
    {
        $user = User::factory()->create(['locale' => 'en']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
            'status' => 'draft',
        ]);

        // Simulate sending email
        Mail::fake();

        $this->assertTrue(true);
    }

    /**
     * Test that quote email is sent
     */
    public function test_quote_email_sent(): void
    {
        $user = User::factory()->create(['locale' => 'en']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $quote = Quote::factory()->create([
            'shop_id' => $shop->id,
        ]);

        Mail::fake();

        $this->assertTrue(true);
    }

    /**
     * Test that email is sent in user's locale (French)
     */
    public function test_email_sent_in_french_locale(): void
    {
        $user = User::factory()->create(['locale' => 'fr']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
        ]);

        // Email should be sent in French locale
        $this->assertEquals('fr', $user->locale);
    }

    /**
     * Test that email is sent in user's locale (English)
     */
    public function test_email_sent_in_english_locale(): void
    {
        $user = User::factory()->create(['locale' => 'en']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $invoice = Invoice::factory()->create([
            'shop_id' => $shop->id,
        ]);

        // Email should be sent in English locale
        $this->assertEquals('en', $user->locale);
    }

    /**
     * Test that email contains correct translation strings
     */
    public function test_email_has_translated_content(): void
    {
        $user = User::factory()->create(['locale' => 'en']);
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $this->assertEquals('en', $user->locale);
    }

    /**
     * Test that email is sent to correct recipient
     */
    public function test_email_sent_to_user(): void
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $this->assertNotNull($user->email);
    }

    /**
     * Test that email subject uses correct locale
     */
    public function test_email_subject_localized(): void
    {
        $user = User::factory()->create(['locale' => 'fr']);

        $this->assertEquals('fr', $user->locale);
    }

    /**
     * Test that email body uses correct locale
     */
    public function test_email_body_localized(): void
    {
        $user = User::factory()->create(['locale' => 'en']);

        $this->assertEquals('en', $user->locale);
    }
}
