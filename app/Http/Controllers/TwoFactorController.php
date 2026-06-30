<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;
use Illuminate\Support\Str;

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

        // Get OTPAUTH URL for authenticator apps
        $otpauthUrl = $this->getOTPAuthUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        // Generate QR code URL using external service
        $qrCodeUrl = $this->generateQRCodeUrl($otpauthUrl);

        return response()->json([
            'qrCodeUrl' => $qrCodeUrl,
            'secret' => $secret,
        ]);
    }

    private function getOTPAuthUrl(string $appName, string $email, string $secret): string
    {
        return sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s',
            rawurlencode($appName),
            rawurlencode($email),
            $secret,
            rawurlencode($appName)
        );
    }

    private function generateQRCodeUrl(string $otpauthUrl): string
    {
        // Use QR Server API (free, no installation required)
        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($otpauthUrl);
    }

    public function verify(Request $request)
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string|digits:6',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Code invalide. Veuillez entrer 6 chiffres.',
                'errors' => $e->errors(),
            ], 422);
        }

        $secret = session('pending_2fa_secret');

        if (!$secret) {
            return response()->json([
                'message' => 'Session expirée. Veuillez recommencer.',
            ], 422);
        }

        // Verify TOTP code with ±1 period tolerance (±30 seconds)
        $isValid = $this->google2fa->verifyKey($secret, $validated['code'], $discrepancy = 1);

        if (!$isValid) {
            return response()->json([
                'message' => 'Code invalide. Veuillez réessayer.',
                'debug' => [
                    'code_received' => $validated['code'],
                    'code_length' => strlen($validated['code']),
                    'secret_exists' => !empty($secret),
                ],
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

        // Vérifier le code TOTP avec tolérance ±1 period (±30 secondes)
        if ($this->google2fa->verifyKey($user->google2fa_secret, $validated['code'], $discrepancy = 1)) {
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

    // Debug route - remove in production
    public function debugSecret()
    {
        $secret = session('pending_2fa_secret');

        if (!$secret) {
            return response()->json([
                'error' => 'No secret in session. Please click "Commencer la configuration" first.',
                'debug_info' => [
                    'session_id' => session()->getId(),
                    'timestamp' => now()->timestamp,
                ],
            ], 404);
        }

        $currentCode = $this->google2fa->getCurrentOtp($secret);
        $verify = $this->google2fa->verifyKey($secret, $currentCode, 1);

        return response()->json([
            'secret' => $secret,
            'secret_length' => strlen($secret),
            'current_code' => $currentCode,
            'code_is_valid' => $verify,
            'timestamp' => now()->timestamp,
            'period' => (int)(now()->timestamp / 30),
            'instructions' => 'Copy the current_code and paste it into the verification form within 30 seconds',
        ]);
    }
}
