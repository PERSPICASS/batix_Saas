<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
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
        $shop = $shop ?? $this->shops()->first();
        
        if ($shop) {
            return route('dashboard.user', [
                'code_user' => $this->code_user,
                'shop_slug' => $shop->slug
            ]);
        }
        
        return route('dashboard');
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
        // Super admin has all permissions
        if ($this->role === 'super_admin') {
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
     * - Manager/Employee: uniquement sa boutique assignée
     */
    public function accessibleShopsQuery()
    {
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
}
