<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationCodeController extends Controller
{
    /**
     * Display the email verification form.
     */
    public function show(): Response|RedirectResponse
    {
        $user = Auth::user();

        // Si l'email est déjà vérifié et l'utilisateur a une boutique, rediriger vers le dashboard
        if ($user->hasVerifiedEmail() && $user->code_user) {
            return redirect()->route('dashboard', ['code_user' => $user->code_user]);
        }

        return Inertia::render('Auth/VerifyEmail', [
            'email' => $user->email,
            'canResend' => true,
        ]);
    }

    /**
     * Verify the email with the provided code.
     */
    public function verify(Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = Auth::user();

        // Vérifier si le code est expiré
        if ($user->email_verification_code_expires_at && 
            now()->isAfter($user->email_verification_code_expires_at)) {
            return response()->json([
                'message' => 'Le code de vérification a expiré. Veuillez demander un nouveau code.',
                'error' => 'expired'
            ], 422);
        }

        // Vérifier si le code correspond
        if ($user->email_verification_code !== $request->code) {
            return response()->json([
                'message' => 'Le code de vérification est incorrect.',
                'error' => 'invalid'
            ], 422);
        }

        // Marquer l'email comme vérifié
        $user->markEmailAsVerified();

        // Nettoyer le code de vérification
        $user->update([
            'email_verification_code' => null,
            'email_verification_code_expires_at' => null,
        ]);

        // Vérifier si l'utilisateur a déjà une boutique
        if ($user->shops()->exists()) {
            // L'utilisateur a déjà une boutique, rediriger vers le dashboard
            return response()->json([
                'message' => 'Votre email a été vérifié avec succès !',
                'redirect' => route('dashboard', ['code_user' => $user->code_user])
            ]);
        }

        // Nouvel utilisateur sans boutique, rediriger vers le formulaire de création de boutique (Étape 3)
        return response()->json([
            'message' => 'Votre email a été vérifié avec succès ! Créez maintenant votre première boutique.',
            'redirect' => route('shop.create.initial')
        ]);
    }

    /**
     * Resend the verification code.
     */
    public function resend(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Si l'email est déjà vérifié
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Votre email est déjà vérifié.',
            ]);
        }

        // Générer un nouveau code
        $code = $this->generateVerificationCode();

        // Mettre à jour l'utilisateur avec le nouveau code
        $user->update([
            'email_verification_code' => $code,
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ]);

        // Envoyer l'email
        \Mail::to($user->email)->send(new \App\Mail\EmailVerificationCode($code, $user->name));

        return response()->json([
            'message' => 'Un nouveau code de vérification a été envoyé à votre adresse email.',
        ]);
    }

    /**
     * Generate a 6-digit verification code.
     */
    private function generateVerificationCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}
