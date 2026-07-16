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
use Illuminate\Validation\ValidationException;

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
            'modules' => UserPermission::MODULES,
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
            'shop_id' => self::shopIdRules($currentUser, $request->input('role')),
            'role' => ['required', Rule::in(self::assignableRoles($currentUser))],
            'is_active' => 'boolean',
            'permissions' => 'array',
            'permissions.*.module' => 'required|string',
            'permissions.*.can_view' => 'boolean',
            'permissions.*.can_create' => 'boolean',
            'permissions.*.can_edit' => 'boolean',
            'permissions.*.can_delete' => 'boolean',
        ]);

        $validated['shop_id'] = self::resolveShopId($currentUser, $validated);
        self::assertNotOrphan($validated['role'], $validated['shop_id']);

        $validated['password'] = Hash::make($validated['password']);
        $permissions = $validated['permissions'] ?? [];
        unset($validated['permissions']);

        $user = User::create($validated);

        // Si l'admin n'a coché aucune permission dans le formulaire, on applique les
        // valeurs par défaut du rôle plutôt que de laisser l'utilisateur sans aucun
        // accès (hasPermission() refuse tout module sans ligne en base).
        if (empty($permissions)) {
            foreach (UserPermission::defaultsForRole($user->role) as $module => $actions) {
                UserPermission::create(['user_id' => $user->id, 'module' => $module] + $actions);
            }
        } else {
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
        }

        // Log activity
        ActivityLogger::created($user, "{$user->name} ({$user->email})");

        return redirect()->route('users.index', ['code_user' => request()->route('code_user')])->with('success', 'Utilisateur créé avec succès.');
    }

    public function edit(string $code_user, User $user): Response
    {
        $currentUser = auth()->user();

        if (!$currentUser->accessibleShopsQuery()->where('id', $user->shop_id)->exists()) {
            abort(403);
        }

        $shops = $currentUser->accessibleShopsQuery()->select('id', 'name')->orderBy('name')->get();
        $user->load('permissions');

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'shops' => $shops,
            'currentUserRole' => $currentUser->role,
            'modules' => UserPermission::MODULES,
        ]);
    }

    public function update(Request $request, string $code_user, User $user): RedirectResponse
    {
        $currentUser = auth()->user();

        if (!$currentUser->accessibleShopsQuery()->where('id', $user->shop_id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'shop_id' => self::shopIdRules($currentUser, $request->input('role')),
            'role' => ['required', Rule::in(self::assignableRoles($currentUser))],
            'is_active' => 'boolean',
            'permissions' => 'array',
            'permissions.*.module' => 'required|string',
            'permissions.*.can_view' => 'boolean',
            'permissions.*.can_create' => 'boolean',
            'permissions.*.can_edit' => 'boolean',
            'permissions.*.can_delete' => 'boolean',
        ]);

        // Un utilisateur ne peut jamais modifier son propre rôle (auto-élévation de privilèges).
        if ($user->id === $currentUser->id) {
            $validated['role'] = $user->role;
        }

        $validated['shop_id'] = self::resolveShopId($currentUser, $validated);
        self::assertNotOrphan($validated['role'], $validated['shop_id']);

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

        if (!auth()->user()->accessibleShopsQuery()->where('id', $user->shop_id)->exists()) {
            abort(403);
        }

        $userName = $user->name;
        $userEmail = $user->email;
        
        $user->permissions()->delete();
        $user->delete();

        // Log activity
        ActivityLogger::deleted($user, "{$userName} ({$userEmail})");

        return redirect()->route('users.index', ['code_user' => request()->route('code_user')])->with('success', "L'utilisateur {$userName} a été supprimé avec succès.");
    }

    /**
     * Roles that $currentUser is allowed to assign to another account.
     * Only account owners (or platform admins) can grant super_admin/admin.
     */
    /**
     * Règles de validation de `shop_id` à la création/modification d'un utilisateur.
     *
     * La boutique est le SEUL lien entre un employé et son compte (`shop.user_id` →
     * propriétaire) : un employé sans boutique n'appartient à aucun compte. Il échappe
     * donc au quota (`canCreateUser()` compte via `whereHas('shop')`), n'apparaît dans
     * aucune liste, et ne peut plus être ni modifié ni supprimé — les gardes exigent
     * que sa boutique fasse partie de celles de l'appelant. Un tel compte est un
     * fantôme irrécupérable, d'où l'obligation.
     *
     * Seul `super_admin` fait exception : il POSSÈDE ses boutiques (`shops()`) au lieu
     * d'y appartenir, et se résout lui-même via `ownerId()`.
     */
    private static function shopIdRules(User $currentUser, ?string $role): array
    {
        // Un appelant non-propriétaire ne choisit pas la boutique — l'UI désactive le
        // champ ("Seul un super admin peut assigner une boutique") et resolveShopId()
        // rattache l'utilisateur à la sienne. La valeur reçue est donc ignorée.
        if ($currentUser->role !== 'super_admin') {
            return ['nullable'];
        }

        return [
            Rule::requiredIf(fn () => $role !== null && $role !== 'super_admin'),
            'nullable',
            Rule::exists('shops', 'id')->whereIn('id', $currentUser->accessibleShopsQuery()->pluck('id')),
        ];
    }

    /**
     * Boutique effective d'un utilisateur créé/modifié. Le propriétaire choisit
     * explicitement ; pour tout autre appelant (un manager, dont le champ est désactivé
     * côté UI) l'utilisateur rejoint la boutique de l'appelant — sans quoi il serait
     * créé sans boutique, donc orphelin (cf. shopIdRules).
     */
    private static function resolveShopId(User $currentUser, array $validated): ?int
    {
        if ($currentUser->role !== 'super_admin') {
            return $currentUser->shop_id;
        }

        return $validated['shop_id'] ?? null;
    }

    /**
     * Dernier filet : la boutique est le seul lien d'un employé vers son compte, donc
     * l'écrire sans boutique le rendrait invisible, hors quota et non supprimable.
     * Attrape les chemins que shopIdRules() ne couvre pas — typiquement un appelant
     * lui-même sans boutique, dont resolveShopId() propagerait le null.
     */
    private static function assertNotOrphan(string $role, ?int $shopId): void
    {
        if ($role !== 'super_admin' && $shopId === null) {
            throw ValidationException::withMessages([
                'shop_id' => "Un utilisateur de ce rôle doit être rattaché à une boutique.",
            ]);
        }
    }

    private static function assignableRoles(User $currentUser): array
    {
        $all = ['super_admin', 'admin', 'manager', 'cashier', 'staff'];

        if (in_array($currentUser->role, ['super_admin', 'admin_platforme'])) {
            return $all;
        }

        return array_values(array_diff($all, ['super_admin', 'admin']));
    }
}
