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
     * Log an activity.
     *
     * $description is a plain-text fallback, stored as-is (only used when no
     * translation key is available at read time — see ActivityLog::getTranslatedDescriptionAttribute()).
     * Pass 'description_key' / 'description_params' inside $properties to make the
     * log message translate itself in the viewer's own language instead.
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

        // Si l'action a été faite via un token API (pas la session web), on le trace —
        // utile pour le propriétaire du compte qui veut savoir ce qu'une intégration a fait.
        $token = $user?->currentAccessToken();
        if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $data['properties'] = array_merge($data['properties'] ?? [], [
                'via_api' => true,
                'api_token_name' => $token->name,
            ]);
        }

        return ActivityLog::create($data);
    }

    /**
     * Log a creation action.
     * $identifier is a short display value (name, number…) shown in the log — it gets
     * translated into "{Création} · {Produit}: {identifier}" in the viewer's language.
     */
    public static function created(Model $model, ?string $identifier = null): ?ActivityLog
    {
        return self::log('create', null, $model, [
            'attributes' => $model->getAttributes(),
            'identifier' => $identifier,
        ]);
    }

    /**
     * Log an update action. See created() for $identifier.
     */
    public static function updated(Model $model, array $changes = [], ?string $identifier = null): ?ActivityLog
    {
        return self::log('update', null, $model, [
            'changes' => $changes,
            'identifier' => $identifier,
        ]);
    }

    /**
     * Log a deletion action. See created() for $identifier.
     */
    public static function deleted(Model $model, ?string $identifier = null): ?ActivityLog
    {
        return self::log('delete', null, $model, [
            'attributes' => $model->getAttributes(),
            'identifier' => $identifier,
        ]);
    }

    /**
     * Log a view action. See created() for $identifier.
     */
    public static function viewed(Model $model, ?string $identifier = null): ?ActivityLog
    {
        return self::log('view', null, $model, ['identifier' => $identifier]);
    }

    /**
     * Log a message that doesn't fit the generic create/update/delete template
     * (e.g. a status change, a conversion, a payment). $key must exist in
     * resources/lang/{locale}/activity.php under 'messages'.
     */
    public static function message(string $action, string $key, array $params = [], ?Model $subject = null, array $extraProperties = []): ?ActivityLog
    {
        return self::log($action, null, $subject, array_merge($extraProperties, [
            'description_key' => $key,
            'description_params' => $params,
        ]));
    }

    /**
     * Log a login action
     */
    public static function login(): ?ActivityLog
    {
        return self::message('login', 'login');
    }

    /**
     * Log a logout action
     */
    public static function logout(): ?ActivityLog
    {
        return self::message('logout', 'logout');
    }

    /**
     * Log a lock screen action
     */
    public static function lockScreen(): ?ActivityLog
    {
        return self::message('lock', 'lock');
    }

    /**
     * Log an unlock screen action
     */
    public static function unlockScreen(): ?ActivityLog
    {
        return self::message('unlock', 'unlock');
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
