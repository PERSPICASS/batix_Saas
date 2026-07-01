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
    public function create(): Response|\Illuminate\Http\RedirectResponse
    {
        $user = Auth::user();

        // Utilisateur connecté mais email non vérifié → Register à l'étape 2
        if ($user && !$user->hasVerifiedEmail()) {
            return Inertia::render('Auth/Register', [
                'initialStep' => 2,
                'initialEmail' => $user->email,
            ]);
        }

        // Utilisateur connecté et vérifié mais sans boutique → étape 3
        if ($user && $user->hasVerifiedEmail() && !$user->shops()->exists()) {
            return Inertia::render('Auth/Register', [
                'initialStep' => 3,
            ]);
        }

        // Utilisateur connecté, vérifié et avec boutique → dashboard
        if ($user && $user->hasVerifiedEmail() && $user->code_user) {
            return redirect()->route('dashboard', ['code_user' => $user->code_user]);
        }

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
            'country' => 'nullable|string|max:100',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Générer un code de vérification à 6 chiffres
        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Créer l'utilisateur avec le rôle super_admin
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'country' => $request->country,
            'password' => Hash::make($request->password),
            'role' => 'super_admin',
            'is_active' => true,
            'email_verification_code' => $verificationCode,
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ]);

        // Envoyer l'email de vérification avec le code OTP
        Mail::to($user->email)->send(new EmailVerificationCode($verificationCode, $user->name, $user));

        event(new Registered($user));

        Auth::login($user);

        // Rediriger vers la page de vérification email (Étape 2)
        return redirect()->route('verification.code.show');
    }
}
