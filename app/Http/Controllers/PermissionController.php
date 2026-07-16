<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Les seuls utilisateurs dont les permissions sont gérables ici : `super_admin` et
     * `admin_platforme` court-circuitent `hasPermission()` (ils ont tout par défaut),
     * leurs lignes de permission n'auraient donc aucun effet.
     */
    private const MANAGEABLE_ROLES_EXCLUDED = ['admin_platforme', 'super_admin'];

    /**
     * Le rôle ne borne PAS le compte : `super_admin` est le rôle de TOUT propriétaire de
     * compte (attribué à l'inscription), pas un rôle plateforme. La boutique de la cible
     * doit donc toujours être confrontée aux boutiques accessibles de l'appelant, sinon
     * un propriétaire peut agir sur les utilisateurs d'un autre compte.
     *
     * Interdit aussi de modifier ses propres permissions : un `manager` ne court-circuite
     * pas `hasPermission()` et pourrait sinon s'accorder tous les droits lui-même.
     */
    private function authorizeManaging(User $target): void
    {
        $authUser = Auth::user();

        if (!in_array($authUser->role, ['super_admin', 'manager'])) {
            abort(403, 'Seul un administrateur peut gérer les permissions.');
        }

        if ($target->id === $authUser->id) {
            abort(403, 'Vous ne pouvez pas modifier vos propres permissions.');
        }

        if (in_array($target->role, self::MANAGEABLE_ROLES_EXCLUDED, true)) {
            abort(403, 'Les permissions de cet utilisateur ne sont pas gérables.');
        }

        if (!$authUser->accessibleShopsQuery()->where('id', $target->shop_id)->exists()) {
            abort(403, 'Vous ne pouvez gérer que les utilisateurs de votre compte.');
        }
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['super_admin', 'manager'])) {
            abort(403, 'Seul un administrateur peut gérer les permissions.');
        }

        $userId = $request->input('user_id');
        $targetUser = null;

        if ($userId) {
            $targetUser = User::findOrFail($userId);

            $this->authorizeManaging($targetUser);
        }

        $users = User::whereIn('shop_id', $user->accessibleShopsQuery()->select('id'))
            ->whereNotIn('role', self::MANAGEABLE_ROLES_EXCLUDED)
            ->where('id', '!=', $user->id)
            ->get();

        $permissions = $targetUser
            ? $targetUser->permissions()->get()->mapWithKeys(fn($p) => [$p->module => $p->toArray()])
            : [];

        return Inertia::render('Permissions/Index', [
            'users' => $users,
            'selectedUser' => $targetUser,
            'modules' => UserPermission::MODULES,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, string $code_user, User $user)
    {
        $this->authorizeManaging($user);

        $validated = $request->validate([
            'permissions' => 'required|array',
            // Borne les modules à la liste canonique : les modules non délégables
            // (facturation, API, IA) ne doivent jamais recevoir de ligne de permission.
            'permissions.*.module' => ['required', 'string', Rule::in(array_keys(UserPermission::MODULES))],
            'permissions.*.can_view' => 'boolean',
            'permissions.*.can_create' => 'boolean',
            'permissions.*.can_edit' => 'boolean',
            'permissions.*.can_delete' => 'boolean',
        ]);

        foreach ($validated['permissions'] as $perm) {
            UserPermission::updateOrCreate(
                ['user_id' => $user->id, 'module' => $perm['module']],
                [
                    'can_view' => $perm['can_view'] ?? false,
                    'can_create' => $perm['can_create'] ?? false,
                    'can_edit' => $perm['can_edit'] ?? false,
                    'can_delete' => $perm['can_delete'] ?? false,
                ]
            );
        }

        return back()->with('success', 'Permissions mises à jour avec succès.');
    }

    public function resetToDefault(string $code_user, User $user)
    {
        $this->authorizeManaging($user);

        foreach (UserPermission::defaultsForRole($user->role) as $module => $perms) {
            UserPermission::updateOrCreate(
                ['user_id' => $user->id, 'module' => $module],
                $perms
            );
        }

        return back()->with('success', 'Permissions réinitialisées aux valeurs par défaut.');
    }
}
