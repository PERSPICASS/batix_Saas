<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    public function index(): Response
    {
        $user = auth()->user();

        return inertia('Auth/TwoFactor', [
            'twoFactorEnabled' => $user->two_factor_enabled,
            'hasSecret' => !is_null($user->google2fa_secret),
        ]);
    }

    public function showVerification(): Response
    {
        return inertia('Auth/VerifyTwoFactor');
    }

    public function generateSecret()
    {
        $user = auth()->user();
        $secret = $this->google2fa->generateSecretKey();

        session(['pending_2fa_secret' => $secret]);

        // Generate QR code as inline SVG data URI
        $qrCodeUrl = $this->google2fa->getQRCodeInline(
            config('app.name'),
            $user->email,
            $secret
        );

        return response()->json([
            'qrCodeUrl' => $qrCodeUrl,
            'secret' => $secret,
        ]);
    }

    public function verify(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|numeric|digits:6',
        ]);

        $secret = session('pending_2fa_secret');

        if (!$secret) {
            return response()->json([
                'message' => 'Session expirée. Veuillez recommencer.',
            ], 422);
        }

        if (!$this->google2fa->verifyKey($secret, $validated['code'])) {
            return response()->json([
                'message' => 'Code invalide. Veuillez réessayer.',
            ], 422);
        }

        $user = auth()->user();
        $user->update([
            'google2fa_secret' => $secret,
            'two_factor_enabled' => true,
            'recovery_codes' => $this->generateRecoveryCodes(),
        ]);

        session()->forget('pending_2fa_secret');

        return response()->json([
            'message' => '2FA activée avec succès!',
            'recoveryCodes' => $user->recovery_codes,
        ]);
    }

    public function disable(Request $request)
    {
        $validated = $request->validate([
            'password' => 'required|current_password',
        ]);

        $user = auth()->user();
        $user->update([
            'two_factor_enabled' => false,
            'google2fa_secret' => null,
            'recovery_codes' => null,
        ]);

        return response()->json([
            'message' => '2FA désactivée avec succès.',
        ]);
    }

    public function checkCode(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
        ]);

        $user = auth()->user();

        // Vérifier le code TOTP
        if ($this->google2fa->verifyKey($user->google2fa_secret, $validated['code'])) {
            session(['2fa_verified' => true]);
            return response()->json(['verified' => true]);
        }

        // Vérifier les codes de secours
        $recoveryCodes = $user->recovery_codes ?? [];
        $codeIndex = array_search($validated['code'], $recoveryCodes);

        if ($codeIndex !== false) {
            // Retirer le code utilisé
            unset($recoveryCodes[$codeIndex]);
            $user->update(['recovery_codes' => array_values($recoveryCodes)]);

            session(['2fa_verified' => true]);
            return response()->json([
                'verified' => true,
                'message' => 'Code de secours utilisé. Il vous en reste ' . count($recoveryCodes) . '.',
            ]);
        }

        return response()->json(['verified' => false], 422);
    }

    private function generateRecoveryCodes(): array
    {
        $codes = [];
        for ($i = 0; $i < 10; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(4)));
        }
        return $codes;
    }
}
