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
        'shop_id',
        'role',
        'is_active',
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
        ];
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
     */
    public function accessibleShopsQuery()
    {
        if ($this->role === 'super_admin') {
            return $this->shops();
        }
        
        // For non-super-admin, return a query that only matches their shop
        return Shop::where('id', $this->shop_id);
    }
}
