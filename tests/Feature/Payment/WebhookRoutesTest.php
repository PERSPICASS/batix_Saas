<?php

namespace Tests\Feature\Payment;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression test for a routing bug found while writing these tests: the Jèko,
 * LemonSqueezy and Paddle webhook routes excluded CSRF via
 * `withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class])`, but that
 * class never existed — the app never defines its own VerifyCsrfToken, Laravel's
 * default is `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken`. The
 * exclusion was therefore a no-op and every real webhook call from these three
 * providers was being rejected with 419 before ever reaching the controller.
 */
class WebhookRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_jeko_webhook_is_not_blocked_by_csrf(): void
    {
        $response = $this->postJson('/jeko/webhook', ['event' => 'test']);

        $this->assertNotEquals(419, $response->getStatusCode());
    }

    public function test_lemonsqueezy_webhook_is_not_blocked_by_csrf(): void
    {
        $response = $this->postJson('/lemonsqueezy/webhook', ['meta' => ['event_name' => 'test']]);

        $this->assertNotEquals(419, $response->getStatusCode());
    }

    public function test_paddle_webhook_is_not_blocked_by_csrf(): void
    {
        $response = $this->postJson('/paddle/webhook', ['event_type' => 'test']);

        $this->assertNotEquals(419, $response->getStatusCode());
    }

    public function test_pawapay_webhook_is_not_blocked_by_csrf(): void
    {
        $response = $this->postJson('/pawapay/webhook', ['depositId' => 'test']);

        $this->assertNotEquals(419, $response->getStatusCode());
    }
}
