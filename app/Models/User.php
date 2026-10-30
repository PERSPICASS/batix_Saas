<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Product;
use App\Models\Depot;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
    * The attributes that are mass assignable.
    *
    * @var list<string>
    * Possible roles: super_admin, admin_platforme, admin, manager, cashier, staff, caisse, employee
     */
    protected $fillable = [
        'name',
        'email',
        'locale',
        'country',
        'password',
        'code_user',
        'shop_id',
        'role',
        'is_active',
        'email_verification_code',
        'email_verification_code_expires_at',
        'two_factor_enabled',
        'google2fa_secret',
        'recovery_codes',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google2fa_secret',
        'recovery_codes',
        'invitation_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            // Hors $fillable exprès : seul l'admin plateforme le pose (forceFill).
            'is_demo' => 'boolean',
            'trial_followups_opted_out_at' => 'datetime',
            'alerts_opted_out_at' => 'datetime',
            'invitation_sent_at' => 'datetime',
            'invitation_accepted_at' => 'datetime',
            'email_verification_code_expires_at' => 'datetime',
            'google2fa_secret' => 'encrypted',
            'recovery_codes' => 'encrypted:array',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->code_user)) {
                $user->code_user = self::generateUniqueCode();
            }
            // Set default locale if not set
            if (empty($user->locale)) {
                $user->locale = config('app.locale', 'fr');
            }
        });
    }

    /**
     * Get the user's locale.
     */
    public function getLocale(): string
    {
        return $this->locale ?? config('app.locale', 'fr');
    }

    /**
     * Generate a unique code for the user.
     */
    public static function generateUniqueCode(): string
    {
        do {
            // Générer un code de 10 caractères (lettres majuscules et chiffres)
            $code = strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 10));
        } while (self::where('code_user', $code)->exists());

        return $code;
    }

    /**
     * Get the dashboard URL for this user with a shop.
     */
    public function getDashboardUrl(?Shop $shop = null): string
    {
        // Admin plateforme a son propre dashboard
        if ($this->role === 'admin_platforme') {
            return route('platform.dashboard');
        }
        
        $shop = $shop ?? $this->shops()->first();
        
        if ($shop) {
            return route('dashboard.user', [
                'code_user' => $this->accountCode(),
                'shop_slug' => $shop->slug
            ]);
        }
        
        // Si pas de shop et pas admin plateforme, rediriger vers le dashboard avec code_user
        if ($this->code_user) {
            return route('dashboard', ['code_user' => $this->accountCode()]);
        }
        
        // Fallback vers login si rien ne fonctionne
        return route('login');
    }

    /**
     * ID du propriétaire (super_admin) du compte auquel appartient cet utilisateur —
     * lui-même s'il est déjà le propriétaire, sinon le propriétaire de sa boutique.
     * Source de vérité pour toute ressource partagée à l'échelle du compte (abonnement,
     * dépôts, quota d'utilisateurs/boutiques...), qui ne doit jamais être résolue via
     * l'ID de l'employé qui agit.
     */
    public function ownerId(): ?int
    {
        if ($this->role === 'super_admin') {
            return $this->id;
        }

        $shop = $this->shop ?? $this->shops()->first();

        return $shop?->user_id;
    }

    /**
     * Code du COMPTE (le {code_user} des URLs et le sélecteur des ressources partagées
     * comme les dépôts ou les logs d'activité) — à ne pas confondre avec `code_user`, qui
     * est un identifiant unique généré pour CHAQUE utilisateur (propriétaire ou employé).
     * Pour le propriétaire (super_admin), les deux coïncident. Pour un employé, le compte
     * est celui du propriétaire de sa boutique.
     */
    public function accountCode(): ?string
    {
        $ownerId = $this->ownerId();

        if ($ownerId === null) {
            return $this->code_user;
        }

        $owner = $ownerId === $this->id ? $this : self::find($ownerId);

        return $owner?->code_user ?? $this->code_user;
    }

    /**
     * Get the shop that the user belongs to.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get the shops created by this user (for backwards compatibility).
     */
    public function shops(): HasMany
    {
        return $this->hasMany(Shop::class);
    }

    /**
     * Get the subscriptions for this user.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get the permissions for the user.
     */
    public function permissions(): HasMany
    {
        return $this->hasMany(UserPermission::class);
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $module, string $action): bool
    {
        // Super admin and platform admin have all permissions
        if ($this->role === 'super_admin' || $this->role === 'admin_platforme') {
            return true;
        }

        $permission = $this->permissions()->where('module', $module)->first();
        
        if (!$permission) {
            return false;
        }

        return match($action) {
            'view' => $permission->can_view,
            'create' => $permission->can_create,
            'edit' => $permission->can_edit,
            'delete' => $permission->can_delete,
            default => false,
        };
    }

    /**
     * Check if user can view a module.
     */
    public function canView(string $module): bool
    {
        return $this->hasPermission($module, 'view');
    }

    /**
     * Check if user can create in a module.
     */
    public function canCreate(string $module): bool
    {
        return $this->hasPermission($module, 'create');
    }

    /**
     * Check if user can edit in a module.
     */
    public function canEdit(string $module): bool
    {
        return $this->hasPermission($module, 'edit');
    }

    /**
     * Check if user can delete in a module.
     */
    public function canDelete(string $module): bool
    {
        return $this->hasPermission($module, 'delete');
    }

    /**
     * Get accessible shops for the user.
     * Super admin gets all their shops, regular users get only their assigned shop.
     * 
     * @return \Illuminate\Database\Eloquent\Collection|\Illuminate\Support\Collection
     */
    public function accessibleShops()
    {
        if ($this->role === 'admin_platforme') {
            // Admin plateforme n'a pas de boutiques personnelles
            return collect([]);
        }
        
        if ($this->role === 'super_admin') {
            return $this->shops->where('is_active', true)->values();
        }
        
        return $this->shop?->is_active ? collect([$this->shop]) : collect([]);
    }

    /**
     * Whether a platform admin has suspended this user's access.
     *
     * Suspension is enforced at login and on every request
     * (EnsureAccountIsActive). It covers the owner's whole staff: a member
     * is blocked when the account owner (their shop's user) is suspended, or
     * when their own shop is. An owner whose every shop is suspended is
     * blocked too — otherwise they would just land on "create a shop".
     */
    public function isSuspended(): bool
    {
        if ($this->role === 'admin_platforme') {
            return false;
        }

        // Strict: a freshly created model has no is_active attribute loaded
        // (null) while the column defaults to true.
        if ($this->is_active === false) {
            return true;
        }

        if ($this->role === 'super_admin') {
            return $this->shops()->exists()
                && !$this->shops()->where('is_active', true)->exists();
        }

        $shop = $this->shop;
        if (!$shop) {
            return false;
        }

        return $shop->is_active === false || $shop->user?->is_active === false;
    }

    /**
     * Get query builder for accessible shops.
     * Used for finding/validating shop ownership.
     * 
     * - Super_admin: toutes les boutiques qu'il possède
     * - Admin_platforme: toutes les boutiques de tous les comptes
     * - Manager/Employee: uniquement sa boutique assignée
     */
    public function accessibleShopsQuery()
    {
        if ($this->role === 'admin_platforme') {
            // Platform admin voit TOUTES les boutiques
            return Shop::query();
        }
        
        // Une boutique suspendue par l'admin plateforme n'est plus accessible.
        if ($this->role === 'super_admin') {
            // Super admin voit toutes ses boutiques
            return $this->shops()->where('is_active', true);
        }
        
        // Pour manager/employee: uniquement sa boutique assignée
        if ($this->shop_id) {
            return Shop::where('id', $this->shop_id)->where('is_active', true);
        }
        
        // Fallback: aucune boutique accessible
        return Shop::where('id', 0);
    }

    /**
     * Compte créé, mot de passe pas encore choisi par l'intéressé (cf. UserInvitation).
     * Personne ne peut s'y connecter : le mot de passe en base est un aléa que nul ne connaît.
     */
    public function isInvitationPending(): bool
    {
        // Un jeton sans acceptation. Un propriétaire inscrit seul n'a jamais eu de jeton ;
        // un employé actif qui reçoit un lien « nouveau mot de passe » a déjà sa date
        // d'acceptation (posée pour tous les comptes existants par la migration du 2026-10-28).
        return $this->invitation_token !== null && $this->invitation_accepted_at === null;
    }

    /**
     * Days of continued access after expires_at before creation actions (shop/user/
     * product/depot) actually get cut off. Gives a window to renew instead of an
     * abrupt lockout the instant the subscription lapses. Only applies to natural
     * expiry (status stays active/trial) — a manually cancelled subscription loses
     * access immediately, see activeSubscription()'s status filter.
     */
    public const SUBSCRIPTION_GRACE_PERIOD_DAYS = 14;

    /**
     * Get the active subscription for the ACCOUNT this user belongs to, including the
     * grace period after expiry (see SUBSCRIPTION_GRACE_PERIOD_DAYS).
     *
     * Subscriptions only ever exist on the account owner's (super_admin) user record —
     * an employee has none of their own. Resolving through `$this->subscriptions()`
     * directly would silently return null for every employee, making every
     * subscription-gated check (canCreateShop, canCreateDepot, hasAiAssistant...) fail
     * closed regardless of the account's real plan.
     */
    public function activeSubscription()
    {
        $ownerId = $this->ownerId();

        if (!$ownerId) {
            return null;
        }

        // Called a dozen times per page (shared props, read-only guard, limits…):
        // memoised for the current HTTP request only. See activeSubscriptionMemo().
        $memo = self::activeSubscriptionMemo();
        $key = "active_subscription.{$ownerId}";

        if ($memo?->has($key)) {
            return $memo->get($key);
        }

        $subscription = $this->queryActiveSubscription($ownerId);
        $memo?->set($key, $subscription);

        return $subscription;
    }

    /**
     * Request-scoped store for activeSubscription(), or null when memoising would
     * be unsafe. Kept on the request rather than on the model: a queue worker or
     * the scheduler keeps the same request instance for days (hence no memo
     * outside HTTP), and tests reuse one User instance across requests while each
     * request is new. Subscription clears its owner's entry whenever it is saved.
     */
    public static function activeSubscriptionMemo(): ?\Symfony\Component\HttpFoundation\ParameterBag
    {
        if (app()->runningInConsole() && ! app()->runningUnitTests()) {
            return null;
        }

        return app()->bound('request') ? request()->attributes : null;
    }

    private function queryActiveSubscription(int $ownerId): ?Subscription
    {
        return Subscription::where('user_id', $ownerId)
            ->whereIn('status', ['active', 'trial'])
            ->where(function ($query) {
                $query
                    // Sans date d'expiration, l'abonnement ne s'éteint pas de lui-même.
                    ->whereNull('expires_at')
                    // Un abonnement PAYANT garde sa fenêtre de renouvellement : le
                    // paiement peut être en cours de traitement le jour de l'échéance.
                    ->orWhere(fn ($q) => $q
                        ->where('status', '!=', 'trial')
                        ->where('expires_at', '>', now()->subDays(self::SUBSCRIPTION_GRACE_PERIOD_DAYS)))
                    // Un ESSAI s'arrête à sa date, sans sursis : rien n'est en cours de
                    // paiement derrière, et prolonger un essai gratuit de 14 jours
                    // revenait à en offrir 28.
                    ->orWhere(fn ($q) => $q
                        ->where('status', 'trial')
                        ->where('expires_at', '>', now()));
            })
            // `id` départage à égalité de `started_at` : deux abonnements ouverts dans la
            // même seconde (renouvellement immédiat, correction manuelle) laissaient
            // sinon la base choisir arbitrairement lequel fait foi.
            ->latest('started_at')
            ->latest('id')
            ->first();
    }

    /**
     * True if the active subscription's expiry date has already passed and we're
     * only still allowing access because of the grace period.
     */
    public function isInSubscriptionGracePeriod(): bool
    {
        $subscription = $this->activeSubscription();

        return (bool) ($subscription?->expires_at?->isPast());
    }

    /**
     * When the grace period actually runs out (null if no active subscription, or
     * the subscription has no expiry date at all — i.e. never expires).
     */
    public function subscriptionGracePeriodEndsAt(): ?\Carbon\Carbon
    {
        $subscription = $this->activeSubscription();

        // Un essai n'a pas de période de grâce : sa date d'expiration est terminale.
        if (!$subscription || !$subscription->expires_at || $subscription->status === 'trial') {
            return null;
        }

        return $subscription->expires_at->copy()->addDays(self::SUBSCRIPTION_GRACE_PERIOD_DAYS);
    }

    /**
     * Check if user can create more shops based on their subscription plan.
     */
    public function canCreateShop(): bool
    {
        // Admin platforme can't create shops
        if ($this->role === 'admin_platforme') {
            return false;
        }

        // Get active subscription
        $subscription = $this->activeSubscription();
        
        if (!$subscription) {
            return false; // No active subscription
        }

        // Le plan, ou la dérogation accordée à un essai (Subscription::trialLimit).
        $maxShops = $subscription->maxShops();

        if ($maxShops === -1) {
            return true;
        }

        // Check current shop count
        $currentShopCount = Shop::where('user_id', $this->ownerId())->count();

        return $currentShopCount < $maxShops;
    }

    /**
     * Check if user can create more users based on their subscription plan.
     */
    public function canCreateUser(?int $shopId = null): bool
    {
        // Admin platforme can't create users
        if ($this->role === 'admin_platforme') {
            return false;
        }

        // Get active subscription
        $subscription = $this->activeSubscription();

        if (!$subscription) {
            return false; // No active subscription
        }

        // Un essai qui a reçu une limite PAR BOUTIQUE : on regarde la boutique visée, ou à
        // défaut s'il reste une place dans l'une d'elles.
        if (($perShop = $subscription->maxUsersPerShop()) !== null) {
            return $shopId !== null
                ? $this->staffCountIn($shopId) < $perShop
                : $this->remainingUserSlots() > 0;
        }

        $plan = $subscription->plan;

        // Check if plan allows unlimited users
        if ($plan->hasUnlimitedUsers()) {
            return true;
        }

        return $this->accountUserCount() < $plan->max_users;
    }

    /**
     * Les utilisateurs du compte, propriétaire compris — une seule fois. Le propriétaire a
     * lui aussi un `shop_id` : l'ancien « employés des boutiques + 1 » le comptait deux
     * fois, si bien qu'un plan à 2 utilisateurs n'admettait aucun employé.
     */
    private function accountUserCount(): int
    {
        $ownerId = $this->ownerId();

        return User::whereHas('shop', fn ($query) => $query->where('user_id', $ownerId))
            ->where('id', '!=', $ownerId)
            ->count() + 1;
    }

    /** Les collaborateurs rattachés à une boutique du compte, propriétaire non compris. */
    private function staffCountIn(int $shopId): int
    {
        return User::where('shop_id', $shopId)->where('id', '!=', $this->ownerId())->count();
    }

    /**
     * Get remaining shop slots.
     */
    public function remainingShopSlots(): int
    {
        $subscription = $this->activeSubscription();
        
        if (!$subscription) {
            return 0;
        }

        $maxShops = $subscription->maxShops();

        if ($maxShops === -1) {
            return -1; // Unlimited
        }

        $currentShopCount = Shop::where('user_id', $this->ownerId())->count();

        return max(0, $maxShops - $currentShopCount);
    }

    /**
     * Get remaining user slots.
     */
    public function remainingUserSlots(): int
    {
        $subscription = $this->activeSubscription();

        if (!$subscription) {
            return 0;
        }

        if (($perShop = $subscription->maxUsersPerShop()) !== null) {
            return Shop::where('user_id', $this->ownerId())->pluck('id')
                ->sum(fn ($id) => max(0, $perShop - $this->staffCountIn($id)));
        }

        $plan = $subscription->plan;

        if ($plan->hasUnlimitedUsers()) {
            return -1; // Unlimited
        }

        return max(0, $plan->max_users - $this->accountUserCount());
    }

    /**
     * Check if user can create more products based on their subscription plan.
     */
    public function canCreateProduct(?int $shopId = null): bool
    {
        if ($this->role === 'admin_platforme') {
            return false;
        }

        $subscription = $this->activeSubscription();

        if (!$subscription) {
            return false;
        }

        $plan = $subscription->plan;

        if ($plan->hasUnlimitedProducts()) {
            return true;
        }

        if ($plan->max_products === 0) {
            return false;
        }

        $currentCount = $shopId
            ? Product::where('shop_id', $shopId)->where('is_active', true)->count()
            : Product::whereIn('shop_id', $this->accessibleShopsQuery()->pluck('id'))->where('is_active', true)->count();

        return $currentCount < $plan->max_products;
    }

    /**
     * Check if user can create more depots based on their subscription plan.
     */
    public function canCreateDepot(): bool
    {
        if ($this->role === 'admin_platforme') {
            return false;
        }

        $subscription = $this->activeSubscription();

        if (!$subscription) {
            return false;
        }

        $plan = $subscription->plan;

        if ($plan->hasUnlimitedDepots()) {
            return true;
        }

        if ($plan->max_depots === 0) {
            return false;
        }

        $currentCount = Depot::where('code_user', $this->accountCode())
            ->where('is_active', true)
            ->count();

        return $currentCount < $plan->max_depots;
    }

    /**
     * Get remaining product slots.
     */
    public function remainingProductSlots(?int $shopId = null): int
    {
        $subscription = $this->activeSubscription();

        if (!$subscription) {
            return 0;
        }

        $plan = $subscription->plan;

        if ($plan->hasUnlimitedProducts()) {
            return -1; // Unlimited
        }

        $currentCount = $shopId
            ? Product::where('shop_id', $shopId)->where('is_active', true)->count()
            : Product::whereIn('shop_id', $this->accessibleShopsQuery()->pluck('id'))->where('is_active', true)->count();

        return max(0, $plan->max_products - $currentCount);
    }

    /**
     * Get remaining depot slots.
     */
    public function remainingDepotSlots(): int
    {
        $subscription = $this->activeSubscription();

        if (!$subscription) {
            return 0;
        }

        $plan = $subscription->plan;

        if ($plan->hasUnlimitedDepots()) {
            return -1; // Unlimited
        }

        $currentCount = Depot::where('code_user', $this->accountCode())
            ->where('is_active', true)
            ->count();

        return max(0, $plan->max_depots - $currentCount);
    }

    /**
     * Get subscription limits info.
     */
    public function getSubscriptionLimits(?int $shopId = null): array
    {
        $subscription = $this->activeSubscription();

        if (!$subscription) {
            $currentProducts = $shopId
                ? Product::where('shop_id', $shopId)->where('is_active', true)->count()
                : 0;
            $currentDepots = Depot::where('code_user', $this->accountCode())->where('is_active', true)->count();

            return [
                'has_subscription' => false,
                'plan_name' => null,
                'max_shops' => 0,
                'max_users' => 0,
                'max_products' => 0,
                'max_depots' => 0,
                'current_shops' => Shop::where('user_id', $this->ownerId())->count(),
                'current_users' => 1,
                'current_products' => $currentProducts,
                'current_depots' => $currentDepots,
                'can_create_shop' => false,
                'can_create_user' => false,
                'can_create_product' => false,
                'can_create_depot' => false,
                'remaining_shops' => 0,
                'remaining_users' => 0,
                'remaining_products' => 0,
                'remaining_depots' => 0,
                'has_ai_assistant' => false,
                'in_grace_period' => false,
                'grace_period_ends_at' => null,
            ];
        }

        $plan = $subscription->plan;
        $ownerId = $this->ownerId();
        $currentShops = Shop::where('user_id', $ownerId)->count();
        $currentUsers = $this->accountUserCount();
        $currentProducts = $shopId
            ? Product::where('shop_id', $shopId)->where('is_active', true)->count()
            : Product::whereIn('shop_id', $this->accessibleShopsQuery()->pluck('id'))->where('is_active', true)->count();
        $currentDepots = Depot::where('code_user', $this->accountCode())->where('is_active', true)->count();

        return [
            'has_subscription' => true,
            'plan_name' => $plan->name,
            'plan_slug' => $plan->slug,
            'max_shops' => $subscription->maxShops(),
            // Avec une limite par boutique : toutes les boutiques permises, plus le propriétaire.
            'max_users' => $subscription->maxUsersPerShop() !== null
                ? $subscription->maxShops() * $subscription->maxUsersPerShop() + 1
                : $plan->max_users,
            'max_users_per_shop' => $subscription->maxUsersPerShop(),
            'max_products' => $plan->max_products,
            'max_depots' => $plan->max_depots,
            'unlimited_shops' => $subscription->maxShops() === -1,
            'unlimited_users' => $subscription->maxUsersPerShop() === null && $plan->hasUnlimitedUsers(),
            'unlimited_products' => $plan->hasUnlimitedProducts(),
            'unlimited_depots' => $plan->hasUnlimitedDepots(),
            'current_shops' => $currentShops,
            'current_users' => $currentUsers,
            'current_products' => $currentProducts,
            'current_depots' => $currentDepots,
            'can_create_shop' => $this->canCreateShop(),
            'can_create_user' => $this->canCreateUser(),
            'can_create_product' => $this->canCreateProduct($shopId),
            'can_create_depot' => $this->canCreateDepot(),
            'remaining_shops' => $this->remainingShopSlots(),
            'remaining_users' => $this->remainingUserSlots(),
            'remaining_products' => $this->remainingProductSlots($shopId),
            'remaining_depots' => $this->remainingDepotSlots(),
            'expires_at' => $subscription->expires_at,
            'status' => $subscription->status,
            'has_ai_assistant' => $subscription->hasAiAssistant(),
            'in_grace_period' => $this->isInSubscriptionGracePeriod(),
            'grace_period_ends_at' => $this->subscriptionGracePeriodEndsAt(),
        ];
    }
}
