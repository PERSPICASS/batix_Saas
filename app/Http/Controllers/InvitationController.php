<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Auth\RedirectsUsers;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class InvitationController extends Controller
{
    use RedirectsUsers;
    /**
     * Display the invitation acceptance page
     */
    public function show(string $token)
    {
        $user = User::where('invitation_token', $token)->first();

        if (!$user) {
            return Inertia::render('Invitation/Invalid', [
                'error' => 'Lien d\'invitation invalide.'
            ]);
        }

        if (!$user->isInvitationValid()) {
            $status = $user->getInvitationStatus();
            
            $message = match($status) {
                'accepted' => 'Cette invitation a déjà été acceptée.',
                'expired' => 'Cette invitation a expiré.',
                default => 'Cette invitation n\'est plus valide.'
            };

            return Inertia::render('Invitation/Invalid', [
                'error' => $message,
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ]);
        }

        return Inertia::render('Invitation/Accept', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'invitation_sent_at' => $user->invitation_sent_at->format('d/m/Y H:i'),
            ],
            'token' => $token,
        ]);
    }

    /**
     * Accept the invitation and create account
     */
    public function accept(Request $request, string $token)
    {
        $user = User::where('invitation_token', $token)->first();

        if (!$user || !$user->isInvitationValid()) {
            return redirect()->route('invitation.show', $token)
                ->with('error', 'Invitation invalide ou expirée.');
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Mise à jour du mot de passe et acceptation de l'invitation
        $user->password = bcrypt($validated['password']);
        $user->acceptInvitation();
        $user->email_verified_at = now();
        $user->save();

        // Connexion automatique
        Auth::login($user);

        return redirect($this->redirectPath())
            ->with('success', 'Bienvenue ! Votre compte a été activé avec succès.');
    }

    /**
     * Generate invitation link for a user (admin only)
     */
    public function generate(User $user)
    {
        $this->authorize('create', User::class);

        $url = $user->getInvitationUrl();

        return back()->with('success', 'Lien d\'invitation généré avec succès.')
            ->with('invitation_url', $url);
    }

    /**
     * Regenerate invitation link (admin only)
     */
    public function regenerate(User $user)
    {
        $this->authorize('create', User::class);

        $user->regenerateInvitationToken();
        $url = $user->getInvitationUrl();

        return back()->with('success', 'Nouveau lien d\'invitation généré.')
            ->with('invitation_url', $url);
    }

    /**
     * Get invitation status for a user
     */
    public function status(User $user)
    {
        $this->authorize('view', User::class);

        return response()->json([
            'status' => $user->getInvitationStatus(),
            'url' => $user->invitation_token ? $user->getInvitationUrl() : null,
            'sent_at' => $user->invitation_sent_at?->format('d/m/Y H:i'),
            'accepted_at' => $user->invitation_accepted_at?->format('d/m/Y H:i'),
            'is_valid' => $user->isInvitationValid(),
        ]);
    }
}
