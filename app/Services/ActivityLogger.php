<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * Log an activity
     */
    public static function log(
        string $action,
        ?string $description = null,
        ?Model $subject = null,
        ?array $properties = null
    ): ?ActivityLog {
        $user = Auth::user();
        
        // Ne JAMAIS logger les actions de l'admin plateforme
        if ($user && $user->role === 'admin_platforme') {
            return null;
        }
        
        $shop = current_shop();

        $data = [
            'action' => $action,
            'description' => $description,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'method' => Request::method(),
            'url' => Request::url(),
        ];

        // User information
        if ($user) {
            $data['user_id'] = $user->id;
            $data['user_name'] = $user->name;
            $data['user_email'] = $user->email;
            $data['user_role'] = $user->role;
            
            if ($user->code_user) {
                $data['account_code'] = $user->code_user;
            }
        }

        // Shop information
        if ($shop) {
            $data['shop_id'] = $shop->id;
            $data['shop_name'] = $shop->name;
        }

        // Subject information
        if ($subject) {
            $data['subject_type'] = get_class($subject);
            $data['subject_id'] = $subject->getKey();
        }

        // Additional properties
        if ($properties) {
            $data['properties'] = $properties;
        }

        return ActivityLog::create($data);
    }

    /**
     * Log a creation action
     */
    public static function created(Model $model, ?string $description = null): ?ActivityLog
    {
        return self::log(
            'create',
            $description ?? "Création d'un(e) " . class_basename($model),
            $model,
            ['attributes' => $model->getAttributes()]
        );
    }

    /**
     * Log an update action
     */
    public static function updated(Model $model, array $changes = [], ?string $description = null): ?ActivityLog
    {
        return self::log(
            'update',
            $description ?? "Modification d'un(e) " . class_basename($model),
            $model,
            ['changes' => $changes]
        );
    }

    /**
     * Log a deletion action
     */
    public static function deleted(Model $model, ?string $description = null): ?ActivityLog
    {
        return self::log(
            'delete',
            $description ?? "Suppression d'un(e) " . class_basename($model),
            $model,
            ['attributes' => $model->getAttributes()]
        );
    }

    /**
     * Log a view action
     */
    public static function viewed(Model $model, ?string $description = null): ?ActivityLog
    {
        return self::log(
            'view',
            $description ?? "Consultation d'un(e) " . class_basename($model),
            $model
        );
    }

    /**
     * Log an export action
     */
    public static function exported(string $type, int $count, ?string $description = null): ?ActivityLog
    {
        return self::log(
            'export',
            $description ?? "Exportation de {$count} {$type}",
            null,
            ['type' => $type, 'count' => $count]
        );
    }

    /**
     * Log an import action
     */
    public static function imported(string $type, int $count, ?string $description = null): ?ActivityLog
    {
        return self::log(
            'import',
            $description ?? "Importation de {$count} {$type}",
            null,
            ['type' => $type, 'count' => $count]
        );
    }

    /**
     * Log a login action
     */
    public static function login(?string $description = null): ?ActivityLog
    {
        return self::log(
            'login',
            $description ?? "Connexion à la plateforme"
        );
    }

    /**
     * Log a logout action
     */
    public static function logout(?string $description = null): ?ActivityLog
    {
        return self::log(
            'logout',
            $description ?? "Déconnexion de la plateforme"
        );
    }

    /**
     * Log a lock screen action
     */
    public static function lockScreen(?string $description = null): ?ActivityLog
    {
        return self::log(
            'lock',
            $description ?? "Verrouillage de l'écran"
        );
    }

    /**
     * Log an unlock screen action
     */
    public static function unlockScreen(?string $description = null): ?ActivityLog
    {
        return self::log(
            'unlock',
            $description ?? "Déverrouillage de l'écran"
        );
    }

    /**
     * Get recent activities for current shop
     */
    public static function recentForShop(int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        $shop = current_shop();
        
        if (!$shop) {
            return collect([]);
        }

        return ActivityLog::forShop($shop->id)
            ->with('user')
            ->recent($limit)
            ->get();
    }

    /**
     * Get recent activities for current user
     */
    public static function recentForUser(int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        $user = Auth::user();
        
        if (!$user) {
            return collect([]);
        }

        return ActivityLog::forUser($user->id)
            ->with('shop')
            ->recent($limit)
            ->get();
    }

    /**
     * Get activities by date range
     */
    public static function forDateRange(string $startDate, string $endDate, ?int $shopId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = ActivityLog::betweenDates($startDate, $endDate);

        if ($shopId) {
            $query->forShop($shopId);
        }

        return $query->with(['user', 'shop'])->latest()->get();
    }
}
