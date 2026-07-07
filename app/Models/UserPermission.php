<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPermission extends Model
{
    /**
     * Liste canonique des modules gérables par le système de permissions granulaire.
     * Unique source de vérité — PermissionController, UserController et
     * InitializePermissions s'y réfèrent tous, pour éviter que la liste ne diverge
     * entre l'écran "Permissions", le formulaire de création d'utilisateur et les
     * valeurs par défaut par rôle (ce qui était le cas jusqu'ici).
     *
     * Volontairement absents : les modules réservés au propriétaire du compte et non
     * délégables (Intégrations API, Facturation/Abonnement, Assistant IA) et les
     * modules d'administration plateforme.
     */
    public const MODULES = [
        'products' => 'Produits',
        'categories' => 'Catégories',
        'customers' => 'Clients',
        'quotes' => 'Devis',
        'preorders' => 'Précommandes',
        'invoices' => 'Factures',
        'recurring_invoices' => 'Factures récurrentes',
        'sales' => 'Ventes',
        'sales_delete' => 'Annuler une vente',
        'sales_restore' => 'Réactiver une vente',
        'returns' => 'Retours',
        'returned_inventory' => 'Inventaire retours',
        'credits' => 'Créances',
        'stocks' => 'Mouvements de stock',
        'inventory' => 'Inventaire',
        'depots' => 'Dépôts',
        'suppliers' => 'Fournisseurs',
        'purchases' => 'Achats',
        'expenses' => 'Dépenses',
        'users' => 'Utilisateurs',
        'shops' => 'Boutiques',
        'analytics' => 'Analytique',
        'activity_logs' => 'Logs d\'activité',
        'settings' => 'Paramètres',
    ];

    protected $fillable = [
        'user_id',
        'module',
        'can_view',
        'can_create',
        'can_edit',
        'can_delete',
    ];

    /**
     * Permissions par défaut pour un rôle donné — unique source de vérité, utilisée
     * à la fois par la commande `permissions:initialize`, par le bouton "Réinitialiser
     * aux valeurs par défaut" de l'écran Permissions, et comme filet de sécurité quand
     * un compte est créé sans permissions explicitement cochées.
     */
    public static function defaultsForRole(string $role): array
    {
        return match ($role) {
            'super_admin', 'admin_platforme' => self::allModulesGranted(),
            'manager' => [
                'products' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'categories' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'customers' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'quotes' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'preorders' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => false],
                'invoices' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'recurring_invoices' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'sales' => ['can_view' => true, 'can_create' => true, 'can_edit' => false, 'can_delete' => true],
                'sales_delete' => ['can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => true],
                'sales_restore' => ['can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => false],
                'returns' => ['can_view' => true, 'can_create' => true, 'can_edit' => false, 'can_delete' => true],
                'returned_inventory' => ['can_view' => true, 'can_create' => false, 'can_edit' => true, 'can_delete' => false],
                'credits' => ['can_view' => true, 'can_create' => false, 'can_edit' => true, 'can_delete' => false],
                'stocks' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'inventory' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'users' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'shops' => ['can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => false],
                'suppliers' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'purchases' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'depots' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'expenses' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true],
                'analytics' => ['can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => false],
                'activity_logs' => ['can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => false],
                'settings' => ['can_view' => true, 'can_create' => false, 'can_edit' => true, 'can_delete' => false],
            ],
            'cashier', 'caisse' => [
                'sales' => ['can_view' => true, 'can_create' => true, 'can_edit' => false, 'can_delete' => false],
                'quotes' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => false],
                'returns' => ['can_view' => true, 'can_create' => true, 'can_edit' => false, 'can_delete' => false],
                'credits' => ['can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => false],
                'customers' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => false],
                'products' => ['can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => false],
            ],
            'employee', 'staff' => [
                'sales' => ['can_view' => true, 'can_create' => true, 'can_edit' => false, 'can_delete' => false],
                'quotes' => ['can_view' => true, 'can_create' => true, 'can_edit' => false, 'can_delete' => false],
                'customers' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => false],
                'products' => ['can_view' => true, 'can_create' => false, 'can_edit' => false, 'can_delete' => false],
                'stocks' => ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => false],
            ],
            default => [],
        };
    }

    private static function allModulesGranted(): array
    {
        return array_fill_keys(
            array_keys(self::MODULES),
            ['can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true]
        );
    }

    protected $casts = [
        'can_view' => 'boolean',
        'can_create' => 'boolean',
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
    ];

    /**
     * Get the user that owns the permission.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
