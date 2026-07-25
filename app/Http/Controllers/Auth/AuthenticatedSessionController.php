<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    use RedirectsUsers;
    /**
     * Display the login view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            // `?expired=1` : le client renvoie ici quand la session a expiré en cours de
            // navigation. Le message s'affiche sur la page d'arrivée, là où l'utilisateur
            // se demande pourquoi il a été déconnecté — plutôt que dans un alert() qui
            // bloquait l'onglet avant la redirection.
            'status' => $request->boolean('expired')
                ? 'Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter.'
                : session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Nettoyer la session de verrouillage d'écran lors d'une nouvelle connexion
        $request->session()->forget(['screen_locked', 'lock_screen_return_url', 'locked_at']);

        // Log the login activity
        ActivityLogger::login();

        return redirect()->intended($this->redirectPath());
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Log the logout activity before destroying the session
        ActivityLogger::logout();

        // Clean lock screen session data before logout
        $request->session()->forget(['screen_locked', 'lock_screen_return_url', 'locked_at']);

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
