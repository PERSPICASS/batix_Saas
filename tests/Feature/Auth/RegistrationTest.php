<?php

namespace Tests\Feature\Auth;

use App\Mail\EmailVerificationCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Regression test: EmailVerificationCode::envelope() used to pass a `locale:`
     * argument to `new Envelope(...)`, a parameter that doesn't exist on that class —
     * registration always threw right after creating the user, since Mail::send()
     * isn't deferred. Without Mail::fake(), this test would actually invoke
     * envelope() and catch the same crash.
     */
    public function test_registration_creates_user_and_sends_verification_code_without_error(): void
    {
        Mail::fake();

        $response = $this->post('/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'secret-password-123',
            'password_confirmation' => 'secret-password-123',
        ]);

        $response->assertRedirect(route('verification.code.show'));

        $user = User::where('email', 'jane@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('super_admin', $user->role);
        $this->assertAuthenticatedAs($user);

        Mail::assertSent(EmailVerificationCode::class, function ($mail) use ($user) {
            // Building the envelope is exactly what crashed before the fix.
            $mail->envelope();

            return $mail->hasTo($user->email);
        });
    }
}
