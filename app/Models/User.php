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

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
    * The attributes that are mass assignable.
    *
    * @var list<string>
    * Possible roles: super_admin, admin_platforme, admin, manager, cashier, staff, caisse, employee
     */
    protected $fillable = [
        'name',
        'email',
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
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
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
        });
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
     * Get the active subscription for this user.
     */
    public function activeSubscription()
    {
        return $this->subscriptions()
            ->whereIn('status', ['active', 'trial'])
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest('started_at')
            ->first();
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
        $currentShopCount = $this->shops()->count();
        
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

        // Count all users belonging to this super_admin's shops
        $currentUserCount = User::whereHas('shop', function ($query) {
            $query->where('user_id', $this->id);
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

        $currentShopCount = $this->shops()->count();
        
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

        $currentUserCount = User::whereHas('shop', function ($query) {
            $query->where('user_id', $this->id);
        })->count() + 1; // +1 for super_admin
        
        return max(0, $plan->max_users - $currentUserCount);
    }

    /**
     * Check if user can create more products based on their subscription plan.
     */
    public function canCreateProduct(?int $shopId = null): bool
    {
        // Products are unlimited for all plans
        if ($this->role === 'admin_platforme') {
            return false;
        }

        $subscription = $this->activeSubscription();
        return $subscription !== null;
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

        $currentCount = Depot::where('code_user', $this->code_user)
            ->where('is_active', true)
            ->count();

        return $currentCount < $plan->max_depots;
    }

    /**
     * Get remaining product slots.
     */
    public function remainingProductSlots(?int $shopId = null): int
    {
        // Products are unlimited for all plans
        return -1;
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

        $currentCount = Depot::where('code_user', $this->code_user)
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
            $currentDepots = Depot::where('code_user', $this->code_user)->where('is_active', true)->count();

            return [
                'has_subscription' => false,
                'plan_name' => null,
                'max_shops' => 0,
                'max_users' => 0,
                'max_products' => 0,
                'max_depots' => 0,
                'current_shops' => $this->shops()->count(),
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
            ];
        }

        $plan = $subscription->plan;
        $currentShops = $this->shops()->count();
        $currentUsers = User::whereHas('shop', function ($query) {
            $query->where('user_id', $this->id);
        })->count() + 1;
        $currentProducts = $shopId
            ? Product::where('shop_id', $shopId)->where('is_active', true)->count()
            : Product::whereIn('shop_id', $this->accessibleShopsQuery()->pluck('id'))->where('is_active', true)->count();
        $currentDepots = Depot::where('code_user', $this->code_user)->where('is_active', true)->count();

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
        ];
    }
}
