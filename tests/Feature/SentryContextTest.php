<?php

namespace Tests\Feature;

use App\Http\Middleware\SentryContext;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SentryContextTest extends TestCase
{
    use RefreshDatabase;

    /**
     * `send_default_pii` only stops the SDK from adding PII by itself — anything the
     * app puts in the scope explicitly is still sent. The middleware must therefore
     * honour the setting rather than hardcode the user's email.
     */
    public function test_no_personal_data_is_sent_to_sentry_by_default(): void
    {
        config(['sentry.send_default_pii' => false]);

        $user = User::factory()->create([
            'email' => 'client@example.com',
            'name' => 'Jean Client',
        ]);

        $context = SentryContext::userContext($user);

        $this->assertArrayNotHasKey('email', $context);
        $this->assertArrayNotHasKey('username', $context);
        $this->assertSame($user->id, $context['id']);
        $this->assertSame($user->code_user, $context['code_user']);

        $this->assertStringNotContainsString('client@example.com', json_encode($context));
        $this->assertStringNotContainsString('Jean Client', json_encode($context));
    }

    public function test_personal_data_is_sent_only_when_explicitly_enabled(): void
    {
        config(['sentry.send_default_pii' => true]);

        $user = User::factory()->create([
            'email' => 'client@example.com',
            'name' => 'Jean Client',
        ]);

        $context = SentryContext::userContext($user);

        $this->assertSame('client@example.com', $context['email']);
        $this->assertSame('Jean Client', $context['username']);
    }

    /**
     * The id is what makes an event traceable back to a user, so dropping the email
     * must not cost us that.
     */
    public function test_events_stay_traceable_to_a_user_without_personal_data(): void
    {
        config(['sentry.send_default_pii' => false]);

        $user = User::factory()->create();

        $context = SentryContext::userContext($user);

        $this->assertSame($user->id, User::where('code_user', $context['code_user'])->first()?->id);
    }

    public function test_authenticated_requests_still_succeed_with_the_middleware_in_the_stack(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($user)->get("/{$user->code_user}/dashboard");

        $this->assertNotSame(500, $response->getStatusCode());
    }
}
