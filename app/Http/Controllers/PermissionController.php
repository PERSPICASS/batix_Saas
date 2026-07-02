<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PermissionController extends Controller
{
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

            if ($user->role === 'manager' && $targetUser->shop_id !== $user->shop_id) {
                abort(403, 'Vous ne pouvez gérer que les utilisateurs de votre boutique.');
            }
        }

        $users = $user->role === 'super_admin'
            ? User::where('role', '!=', 'admin_platforme')->get()
            : User::where('shop_id', $user->shop_id)->where('role', '!=', 'super_admin')->get();

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

    public function update(Request $request, User $user)
    {
        $authUser = Auth::user();

        if (!in_array($authUser->role, ['super_admin', 'manager'])) {
            abort(403);
        }

        if ($authUser->role === 'manager' && $user->shop_id !== $authUser->shop_id) {
            abort(403);
        }

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*.module' => 'required|string',
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

    public function resetToDefault(User $user)
    {
        $authUser = Auth::user();

        if (!in_array($authUser->role, ['super_admin', 'manager'])) {
            abort(403);
        }

        if ($authUser->role === 'manager' && $user->shop_id !== $authUser->shop_id) {
            abort(403);
        }

        foreach (UserPermission::defaultsForRole($user->role) as $module => $perms) {
            UserPermission::updateOrCreate(
                ['user_id' => $user->id, 'module' => $module],
                $perms
            );
        }

        return back()->with('success', 'Permissions réinitialisées aux valeurs par défaut.');
    }
}
