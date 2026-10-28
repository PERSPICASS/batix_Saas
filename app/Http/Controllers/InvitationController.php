<?php

namespace App\Http\Controllers;

use App\Services\UserInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * La page publique où un employé choisit son mot de passe, depuis le lien reçu par email
 * ou transmis par le propriétaire (cf. UserInvitation).
 */
class InvitationController extends Controller
{
    public function show(string $token): Response
    {
        $user = UserInvitation::find($token);

        return Inertia::render('Auth/AcceptInvitation', [
            'token' => $token,
            'valid' => $user !== null,
            'user' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
                'shop' => $user->shop?->name,
                'pending' => $user->isInvitationPending(),
            ] : null,
        ]);
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        $user = UserInvitation::find($token);

        if (!$user) {
            return redirect()->route('invitation.show', ['token' => $token]);
        }

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        UserInvitation::accept($user, $validated['password']);

        // Le lien a pu être ouvert dans un navigateur où quelqu'un d'autre est connecté.
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->regenerateToken();

        return redirect()->route('dashboard', ['code_user' => $user->accountCode()])
            ->with('success', __('auth.invitation.welcome', ['name' => $user->name]));
    }
}
