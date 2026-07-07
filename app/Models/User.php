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
        'invitation_token',
        'invitation_sent_at',
        'invitation_accepted_at',
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
                'code_user' => $this->code_user,
                'shop_slug' => $shop->slug
            ]);
        }
        
        // Si pas de shop et pas admin plateforme, rediriger vers le dashboard avec code_user
        if ($this->code_user) {
            return route('dashboard', ['code_user' => $this->code_user]);
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
            return $this->shops;
        }
        
        return $this->shop ? collect([$this->shop]) : collect([]);
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
        
        if ($this->role === 'super_admin') {
            // Super admin voit toutes ses boutiques
            return $this->shops();
        }
        
        // Pour manager/employee: uniquement sa boutique assignée
        if ($this->shop_id) {
            return Shop::where('id', $this->shop_id);
        }
        
        // Fallback: aucune boutique accessible
        return Shop::where('id', 0);
    }

    /**
     * Generate a unique invitation token for the user
     */
    public function generateInvitationToken(): string
    {
        $this->invitation_token = bin2hex(random_bytes(32));
        $this->invitation_sent_at = now();
        $this->save();

        return $this->invitation_token;
    }

    /**
     * Get the invitation URL for this user
     */
    public function getInvitationUrl(): string
    {
        if (!$this->invitation_token) {
            $this->generateInvitationToken();
        }

        return url("/invitation/{$this->invitation_token}");
    }

    /**
     * Check if the invitation is still valid
     */
    public function isInvitationValid(): bool
    {
        if (!$this->invitation_token) {
            return false;
        }

        // Si déjà acceptée, invalide
        if ($this->invitation_accepted_at) {
            return false;
        }

        // Vérifier si l'invitation n'est pas expirée (30 jours par défaut)
        $expirationDays = config('auth.invitation_expiration_days', 30);
        
        if ($this->invitation_sent_at && $this->invitation_sent_at->addDays($expirationDays)->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Accept the invitation
     */
    public function acceptInvitation(): void
    {
        $this->invitation_accepted_at = now();
        $this->save();
    }

    /**
     * Regenerate invitation token (useful if expired)
     */
    public function regenerateInvitationToken(): string
    {
        $this->invitation_accepted_at = null;
        return $this->generateInvitationToken();
    }

    /**
     * Get invitation status
     */
    public function getInvitationStatus(): string
    {
        if (!$this->invitation_token) {
            return 'not_sent';
        }

        if ($this->invitation_accepted_at) {
            return 'accepted';
        }

        if (!$this->isInvitationValid()) {
            return 'expired';
        }

        return 'pending';
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

        return Subscription::where('user_id', $ownerId)
            ->whereIn('status', ['active', 'trial'])
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now()->subDays(self::SUBSCRIPTION_GRACE_PERIOD_DAYS));
            })
            ->latest('started_at')
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

        if (!$subscription || !$subscription->expires_at) {
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

        $plan = $subscription->plan;
        
        // Check if plan allows unlimited shops
        if ($plan->hasUnlimitedShops()) {
            return true;
        }

        // Check current shop count
        $currentShopCount = Shop::where('user_id', $this->ownerId())->count();

        return $currentShopCount < $plan->max_shops;
    }

    /**
     * Check if user can create more users based on their subscription plan.
     */
    public function canCreateUser(): bool
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

        $plan = $subscription->plan;

        // Check if plan allows unlimited users
        if ($plan->hasUnlimitedUsers()) {
            return true;
        }

        // Count all users belonging to the account owner's shops
        $ownerId = $this->ownerId();
        $currentUserCount = User::whereHas('shop', function ($query) use ($ownerId) {
            $query->where('user_id', $ownerId);
        })->count();

        // Also count the super_admin themselves
        $currentUserCount += 1;
        
        return $currentUserCount < $plan->max_users;
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

        $plan = $subscription->plan;
        
        if ($plan->hasUnlimitedShops()) {
            return -1; // Unlimited
        }

        $currentShopCount = Shop::where('user_id', $this->ownerId())->count();

        return max(0, $plan->max_shops - $currentShopCount);
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

        $plan = $subscription->plan;

        if ($plan->hasUnlimitedUsers()) {
            return -1; // Unlimited
        }

        $ownerId = $this->ownerId();
        $currentUserCount = User::whereHas('shop', function ($query) use ($ownerId) {
            $query->where('user_id', $ownerId);
        })->count() + 1; // +1 for super_admin
        
        return max(0, $plan->max_users - $currentUserCount);
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
        $currentUsers = User::whereHas('shop', function ($query) use ($ownerId) {
            $query->where('user_id', $ownerId);
        })->count() + 1;
        $currentProducts = $shopId
            ? Product::where('shop_id', $shopId)->where('is_active', true)->count()
            : Product::whereIn('shop_id', $this->accessibleShopsQuery()->pluck('id'))->where('is_active', true)->count();
        $currentDepots = Depot::where('code_user', $this->accountCode())->where('is_active', true)->count();

        return [
            'has_subscription' => true,
            'plan_name' => $plan->name,
            'plan_slug' => $plan->slug,
            'max_shops' => $plan->max_shops,
            'max_users' => $plan->max_users,
            'max_products' => $plan->max_products,
            'max_depots' => $plan->max_depots,
            'unlimited_shops' => $plan->hasUnlimitedShops(),
            'unlimited_users' => $plan->hasUnlimitedUsers(),
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
