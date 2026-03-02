<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Mail\EmailVerificationCode;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Générer un code de vérification à 6 chiffres
        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Créer l'utilisateur avec le rôle super_admin
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'super_admin',
            'is_active' => true,
            'email_verification_code' => $verificationCode,
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ]);

        // Envoyer l'email de vérification avec le code OTP
        Mail::to($user->email)->send(new EmailVerificationCode($verificationCode, $user->name));

        event(new Registered($user));

        Auth::login($user);

        // Rediriger vers la page de vérification email (Étape 2)
        return redirect()->route('verification.code.show');
    }
}
