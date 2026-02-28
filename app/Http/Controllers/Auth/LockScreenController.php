<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LockScreenController extends Controller
{
    /**
     * Display the lock screen.
     */
    public function show(): Response|RedirectResponse
    {
        // Si pas authentifié, rediriger vers login
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // Si pas verrouillé, rediriger vers le dashboard approprié
        if (!session('screen_locked')) {
            return $this->redirectToDashboard();
        }

        $user = Auth::user();

        return Inertia::render('Auth/LockScreen', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar ?? null,
            ],
            'returnUrl' => session('lock_screen_return_url', '/'),
        ]);
    }

    /**
     * Lock the screen.
     */
    public function lock(Request $request): RedirectResponse
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // Sauvegarder l'URL actuelle pour revenir après déverrouillage
        $returnUrl = $request->header('Referer') ?? url()->previous();
        session([
            'screen_locked' => true,
            'lock_screen_return_url' => $returnUrl,
            'locked_at' => now(),
        ]);

        // Log the lock screen activity
        ActivityLogger::lockScreen();

        return redirect()->route('lock-screen.show');
    }

    /**
     * Unlock the screen.
     */
    public function unlock(Request $request): RedirectResponse
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = Auth::user();

        // Vérifier le mot de passe
        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => __('Le mot de passe est incorrect.'),
            ]);
        }

        // Déverrouiller l'écran
        $returnUrl = session('lock_screen_return_url', '/');
        session()->forget(['screen_locked', 'lock_screen_return_url', 'locked_at']);

        // Régénérer la session pour sécurité
        $request->session()->regenerate();

        // Log the unlock activity
        ActivityLogger::unlockScreen();

        return redirect($returnUrl)->with('success', 'Écran déverrouillé avec succès.');
    }

    /**
     * Redirect to the appropriate dashboard based on user role.
     */
    private function redirectToDashboard(): RedirectResponse
    {
        $user = Auth::user();

        if ($user->role === 'admin_platforme') {
            return redirect()->route('platform.dashboard');
        }

        if ($user->code_user) {
            return redirect()->route('dashboard', ['code_user' => $user->code_user]);
        }

        return redirect()->route('login');
    }
}
