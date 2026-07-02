<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\User;
use App\Models\UserPermission;
use App\Services\ActivityLogger;
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
        $currentUser = auth()->user();

        $users = User::with('shop')
            ->where(function ($query) use ($currentUser) {
                // Si l'utilisateur est super_admin, afficher tous les utilisateurs de ses boutiques
                if ($currentUser->role === 'super_admin') {
                    // Récupérer les IDs de toutes les boutiques du super admin
                    $shopIds = $currentUser->shops()->pluck('id');
                    $query->whereIn('shop_id', $shopIds);
                } else {
                    // Pour les autres rôles, afficher uniquement les utilisateurs de la boutique active
                    $activeShopId = get_active_shop_id();
                    if ($activeShopId) {
                        $query->where('shop_id', $activeShopId);
                    } else {
                        // Si pas de boutique active, ne rien afficher
                        $query->whereRaw('1 = 0');
                    }
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'canCreateUser' => $currentUser->canCreateUser(),
            'remainingUsers' => $currentUser->remainingUserSlots(),
        ]);
    }

    public function create(): Response
    {
        $user = auth()->user();
        $shops = $user->accessibleShopsQuery()->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Users/Create', [
            'shops' => $shops,
            'currentUserRole' => $user->role,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentUser = auth()->user();

        // Vérifier la limite d'utilisateurs
        if (!$currentUser->canCreateUser()) {
            $limits = $currentUser->getSubscriptionLimits();
            $max = $limits['max_users'];
            return back()->with('error', "Vous avez atteint la limite de {$max} utilisateur(s) de votre offre. Passez à un plan supérieur pour en ajouter davantage.");
        }

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

        // Log activity
        ActivityLogger::created($user, "{$user->name} ({$user->email})");

        return redirect()->route('users.index', ['code_user' => request()->route('code_user')])->with('success', 'Utilisateur créé avec succès.');
    }

    public function edit(string $code_user, User $user): Response
    {
        $currentUser = auth()->user();
        $shops = $currentUser->accessibleShopsQuery()->select('id', 'name')->orderBy('name')->get();
        $user->load('permissions');

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'shops' => $shops,
            'currentUserRole' => $currentUser->role,
        ]);
    }

    public function update(Request $request, string $code_user, User $user): RedirectResponse
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

        // Log activity
        ActivityLogger::updated($user, [], "{$user->name} ({$user->email})");

        return redirect()->route('users.index', ['code_user' => request()->route('code_user')])->with('success', 'Utilisateur mis à jour avec succès.');
    }

    public function destroy(string $code_user, User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return redirect()->route('users.index', ['code_user' => request()->route('code_user')])->with('error', 'Vous ne pouvez pas supprimer votre propre compte.');
        }

        $userName = $user->name;
        $userEmail = $user->email;
        
        $user->permissions()->delete();
        $user->delete();

        // Log activity
        ActivityLogger::deleted($user, "{$userName} ({$userEmail})");

        return redirect()->route('users.index', ['code_user' => request()->route('code_user')])->with('success', "L'utilisateur {$userName} a été supprimé avec succès.");
    }
}
