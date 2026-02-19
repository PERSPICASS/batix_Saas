<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::with('shop')
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        
        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }

    public function create(): Response
    {
        $shops = Shop::select('id', 'name')->orderBy('name')->get();
        
        return Inertia::render('Users/Create', [
            'shops' => $shops,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'shop_id' => 'nullable|exists:shops,id',
            'role' => ['required', Rule::in(['super_admin', 'admin', 'manager', 'cashier', 'staff'])],
            'is_active' => 'boolean',
            'permissions' => 'array',
            'permissions.*.module' => 'required|string',
            'permissions.*.can_view' => 'boolean',
            'permissions.*.can_create' => 'boolean',
            'permissions.*.can_edit' => 'boolean',
            'permissions.*.can_delete' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $permissions = $validated['permissions'] ?? [];
        unset($validated['permissions']);
        
        $user = User::create($validated);

        // Create permissions
        foreach ($permissions as $permission) {
            UserPermission::create([
                'user_id' => $user->id,
                'module' => $permission['module'],
                'can_view' => $permission['can_view'] ?? false,
                'can_create' => $permission['can_create'] ?? false,
                'can_edit' => $permission['can_edit'] ?? false,
                'can_delete' => $permission['can_delete'] ?? false,
            ]);
        }

        return redirect()->route('users.index')->with('success', 'Utilisateur créé avec succès.');
    }

    public function edit(User $user): Response
    {
        $shops = Shop::select('id', 'name')->orderBy('name')->get();
        $user->load('permissions');
        
        return Inertia::render('Users/Edit', [
            'user' => $user,
            'shops' => $shops,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'shop_id' => 'nullable|exists:shops,id',
            'role' => ['required', Rule::in(['super_admin', 'admin', 'manager', 'cashier', 'staff'])],
            'is_active' => 'boolean',
            'permissions' => 'array',
            'permissions.*.module' => 'required|string',
            'permissions.*.can_view' => 'boolean',
            'permissions.*.can_create' => 'boolean',
            'permissions.*.can_edit' => 'boolean',
            'permissions.*.can_delete' => 'boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $permissions = $validated['permissions'] ?? [];
        unset($validated['permissions']);

        $user->update($validated);

        // Delete existing permissions and recreate
        $user->permissions()->delete();
        foreach ($permissions as $permission) {
            UserPermission::create([
                'user_id' => $user->id,
                'module' => $permission['module'],
                'can_view' => $permission['can_view'] ?? false,
                'can_create' => $permission['can_create'] ?? false,
                'can_edit' => $permission['can_edit'] ?? false,
                'can_delete' => $permission['can_delete'] ?? false,
            ]);
        }

        return redirect()->route('users.index')->with('success', 'Utilisateur mis à jour avec succès.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return redirect()->route('users.index')->with('error', 'Vous ne pouvez pas supprimer votre propre compte.');
        }

        $userName = $user->name;
        $user->permissions()->delete();
        $user->delete();

        return redirect()->route('users.index')->with('success', "L'utilisateur {$userName} a été supprimé avec succès.");
    }
}
