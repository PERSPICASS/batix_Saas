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
     * Get a human-readable action label
     */
    public function getActionLabelAttribute(): string
    {
        $labels = [
            'create' => 'Création',
            'update' => 'Modification',
            'delete' => 'Suppression',
            'view' => 'Consultation',
            'export' => 'Exportation',
            'import' => 'Importation',
            'login' => 'Connexion',
            'logout' => 'Déconnexion',
            'lock' => 'Verrouillage',
            'unlock' => 'Déverrouillage',
            'restore' => 'Restauration',
        ];

        return $labels[$this->action] ?? ucfirst($this->action);
    }

    /**
     * Get a human-readable subject label
     */
    public function getSubjectLabelAttribute(): string
    {
        if (!$this->subject_type) {
            return '-';
        }

        $labels = [
            'App\Models\Product' => 'Produit',
            'App\Models\Category' => 'Catégorie',
            'App\Models\Customer' => 'Client',
            'App\Models\Supplier' => 'Fournisseur',
            'App\Models\Invoice' => 'Facture',
            'App\Models\Sale' => 'Vente',
            'App\Models\Shop' => 'Boutique',
            'App\Models\User' => 'Utilisateur',
        ];

        return $labels[$this->subject_type] ?? class_basename($this->subject_type);
    }

    /**
     * Get changes summary
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
                $summary[] = "{$field}: \"{$values['old']}\" → \"{$values['new']}\"";
            }
        }

        return implode(', ', $summary);
    }
}
