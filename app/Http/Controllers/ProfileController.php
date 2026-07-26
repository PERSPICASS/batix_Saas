<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Services\AccountDeletion;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            // Le pays n'est pas partagé par HandleInertiaRequests : il ne sert qu'ici,
            // inutile de le joindre au payload de chaque page.
            'country' => $request->user()->country,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        // Sans message flash, l'enregistrement ne se voyait pas : ToastContainer n'affiche
        // que ce que le serveur met dans `flash`. La clé vit dans resources/lang, seul
        // chemin que Laravel lit ici — le `lang/` de la racine n'est jamais chargé.
        return Redirect::route('profile.edit')->with('success', __('profile.updated'));
    }

    /**
     * Update the user's preferred locale (used e.g. to pick the language of transactional emails).
     */
    public function updateLocale(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'locale' => 'required|string|in:fr,en',
        ]);

        $request->user()->update(['locale' => $validated['locale']]);

        return response()->json(['locale' => $validated['locale']]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request, AccountDeletion $accounts): RedirectResponse
    {
        $user = $request->user();

        // Seul le propriétaire du compte supprime le compte. Un gérant ou un caissier
        // n'a pas de compte à lui : il appartient à une boutique, et son retrait passe
        // par la gestion des utilisateurs. Le formulaire est déjà réservé au super_admin,
        // mais une route ne se garde pas côté interface.
        abort_unless($user->role === 'super_admin', 403);

        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        // La déconnexion doit précéder la suppression, et ce n'est pas un détail d'ordre :
        // Auth::logout() fait tourner le « remember token », donc un save() sur le modèle.
        // Sur un modèle déjà supprimé, exists vaut false et save() devient un INSERT — la
        // ligne ressuscite, puis échoue sur la clé étrangère vers la boutique disparue.
        //
        // Le mot de passe est validé plus haut, donc rien de prévisible ne peut échouer
        // entre les deux ; et la suppression elle-même est transactionnelle.
        Auth::logout();

        $accounts->delete($user);

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Pas de message flash ici : la page d'accueil publique ne monte pas
        // ToastContainer, il ne s'afficherait nulle part.
        return Redirect::to('/');
    }
}
