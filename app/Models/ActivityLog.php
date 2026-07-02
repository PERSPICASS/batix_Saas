<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'user_role',
        'shop_id',
        'shop_name',
        'account_code',
        'action',
        'description',
        'subject_type',
        'subject_id',
        'properties',
        'ip_address',
        'user_agent',
        'method',
        'url',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the shop where the action was performed.
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get the subject (polymorphic).
     */
    public function subject()
    {
        if ($this->subject_type && $this->subject_id) {
            return $this->subject_type::find($this->subject_id);
        }
        return null;
    }

    /**
     * Scope: Filter by user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Filter by shop
     */
    public function scopeForShop($query, $shopId)
    {
        return $query->where('shop_id', $shopId);
    }

    /**
     * Scope: Filter by action
     */
    public function scopeWithAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope: Filter by subject type
     */
    public function scopeForSubjectType($query, $type)
    {
        return $query->where('subject_type', $type);
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope: Recent activities
     */
    public function scopeRecent($query, $limit = 50)
    {
        return $query->latest()->limit($limit);
    }

    /**
     * Translate a lang key, or return $fallback if no translation exists for it.
     */
    public static function translateOrFallback(string $key, string $fallback): string
    {
        return __($key) !== $key ? __($key) : $fallback;
    }

    /**
     * Get a human-readable, locale-aware action label
     */
    public function getActionLabelAttribute(): string
    {
        return self::translateOrFallback('activity.actions.' . $this->action, ucfirst($this->action));
    }

    /**
     * Get a human-readable, locale-aware subject label
     */
    public function getSubjectLabelAttribute(): string
    {
        if (!$this->subject_type) {
            return '-';
        }

        return self::translateOrFallback('activity.subjects.' . $this->subject_type, class_basename($this->subject_type));
    }

    /**
     * Get a locale-aware, human-readable description.
     *
     * If the log was written with a structured description_key/description_params
     * (see ActivityLogger), it's rendered fresh in the current locale. Otherwise,
     * falls back to whatever plain-text description was stored at write time
     * (older entries, always in the language they were originally logged in).
     */
    public function getTranslatedDescriptionAttribute(): ?string
    {
        $key = $this->properties['description_key'] ?? null;

        if ($key) {
            $params = $this->properties['description_params'] ?? [];

            // Certains messages référencent des valeurs elles-mêmes traduisibles
            // (ex. un statut) : on les traduit ici, à la lecture, plutôt qu'à
            // l'écriture, pour respecter la langue du lecteur et non celle de l'auteur.
            if ($key === 'preorder_status_changed') {
                $params['old'] = self::translateOrFallback('activity.preorder_statuses.' . ($params['old'] ?? ''), $params['old'] ?? '');
                $params['new'] = self::translateOrFallback('activity.preorder_statuses.' . ($params['new'] ?? ''), $params['new'] ?? '');
            }

            return __('activity.messages.' . $key, $params);
        }

        // Only treat this as a "generic" entry if it actually went through
        // ActivityLogger::created()/updated()/deleted()/viewed() (subject present,
        // 'identifier' key set even if null) — otherwise fall back to the raw
        // stored description (legacy entries written before this system existed).
        if ($this->subject_type && array_key_exists('identifier', (array) $this->properties)) {
            $identifier = $this->properties['identifier'];

            return __($identifier !== null ? 'activity.generic_with_identifier' : 'activity.generic_without_identifier', [
                'action' => $this->action_label,
                'subject' => $this->subject_label,
                'identifier' => $identifier,
            ]);
        }

        return $this->description;
    }

    /**
     * Get changes summary, with translated field names when known.
     */
    public function getChangesSummary(): ?string
    {
        if (!$this->properties || !isset($this->properties['changes'])) {
            return null;
        }

        $changes = $this->properties['changes'];
        $summary = [];

        foreach ($changes as $field => $values) {
            if (isset($values['old']) && isset($values['new'])) {
                $fieldKey = 'activity.fields.' . $field;
                $label = __($fieldKey) !== $fieldKey ? __($fieldKey) : $field;
                $summary[] = "{$label}: \"{$values['old']}\" → \"{$values['new']}\"";
            }
        }

        return implode(', ', $summary);
    }
}
