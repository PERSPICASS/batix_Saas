<?php

namespace App\Traits;

use App\Services\ActivityLogger;

trait LogsActivity
{
    /**
     * Boot the trait
     */
    public static function bootLogsActivity()
    {
        // Log creation
        static::created(function ($model) {
            if (should_log_activity()) {
                ActivityLogger::created($model);
            }
        });

        // Log update
        static::updated(function ($model) {
            if (should_log_activity() && $model->wasChanged()) {
                $changes = [];
                foreach ($model->getChanges() as $key => $value) {
                    if ($key !== 'updated_at') {
                        $changes[$key] = [
                            'old' => $model->getOriginal($key),
                            'new' => $value,
                        ];
                    }
                }
                
                if (!empty($changes)) {
                    ActivityLogger::updated($model, $changes);
                }
            }
        });

        // Log deletion
        static::deleted(function ($model) {
            if (should_log_activity()) {
                ActivityLogger::deleted($model);
            }
        });
    }

    /**
     * Log a custom action on this model
     */
    public function logActivity(string $action, ?string $description = null, ?array $properties = null)
    {
        return ActivityLogger::log($action, $description, $this, $properties);
    }
}
