<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordResetRevokesSessionsTest extends TestCase
{
    use RefreshDatabase;

    private function seedSession(string $id, int $userId): void
    {
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => $userId,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test-agent',
            'payload' => base64_encode(serialize([])),
            'last_activity' => time(),
        ]);
    }

    public function test_changing_password_revokes_other_sessions_and_tokens_but_keeps_the_current_one(): void
    {
        // The "keep the current session" half of this only means something against
        // real session persistence — force the database driver for this test so
        // Laravel's own StartSession middleware actually writes/updates a row for the
        // request's session, the same as it would with the app's default config.
        config(['session.driver' => 'database']);

        $user = User::factory()->create(['password' => Hash::make('old-password')]);

        $this->seedSession('attacker-session-id', $user->id);

        // A first request establishes and persists the "current" session row.
        $this->actingAs($user)->get('/login');
        $currentSessionId = $this->app['session']->getId();
        $this->assertDatabaseHas('sessions', ['id' => $currentSessionId]);

        $user->createToken('mobile-app');

        $response = $this->withCookie(config('session.cookie'), $currentSessionId)
            ->actingAs($user)
            ->put('/password', [
                'current_password' => 'old-password',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('sessions', ['id' => 'attacker-session-id']);
        $this->assertDatabaseHas('sessions', ['id' => $currentSessionId]);
        $this->assertSame(0, $user->tokens()->count(), 'API tokens must be revoked on password change');
    }

    public function test_forgot_password_reset_revokes_all_sessions_and_tokens(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);

        $this->seedSession('some-session-id', $user->id);
        $user->createToken('mobile-app');

        $token = app('auth.password.broker')->createToken($user);

        $response = $this->post('/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('sessions', ['id' => 'some-session-id']);
        $this->assertSame(0, $user->fresh()->tokens()->count());
        $this->assertTrue(Hash::check('brand-new-password', $user->fresh()->password));
    }
}
