# 🔄 Guide de Migration des Fournisseurs

## Contexte
Suite à l'ajout de la colonne `shop_id` dans la table `suppliers`, les enregistrements existants ont cette colonne à `NULL`. Ce guide explique comment assigner ces fournisseurs aux boutiques appropriées.

---

## ⚠️ Situation Actuelle

### État de la Base de Données
```sql
-- Vérifier les fournisseurs sans boutique
SELECT id, name, company_name, shop_id 
FROM suppliers 
WHERE shop_id IS NULL;
```

### Problème
- Les fournisseurs avec `shop_id = NULL` ne seront **PAS visibles** dans l'application
- Le filtre `whereHas('shop')` dans le contrôleur les exclut
- Ils sont dans la base mais inaccessibles

---

## 🎯 Solutions Possibles

### Option 1: Assigner à l'Utilisateur Principal (Recommandé pour Mono-Utilisateur)

Si vous êtes le seul utilisateur du système et que vous avez une seule boutique:

```sql
-- 1. Trouver l'ID de votre boutique
SELECT id, name, user_id FROM shops;

-- 2. Assigner TOUS les fournisseurs à cette boutique
UPDATE suppliers 
SET shop_id = 1  -- Remplacer par votre shop_id
WHERE shop_id IS NULL;
```

### Option 2: Assigner à la Première Boutique de Chaque Utilisateur

Si vous avez plusieurs utilisateurs:

```sql
-- Assigner chaque fournisseur à la première boutique de l'utilisateur qui l'a créé
UPDATE suppliers s
JOIN (
    SELECT u.id as user_id, MIN(sh.id) as first_shop_id
    FROM users u
    JOIN shops sh ON sh.user_id = u.id
    GROUP BY u.id
) first_shops ON first_shops.user_id = 1  -- Remplacer par l'ID utilisateur approprié
SET s.shop_id = first_shops.first_shop_id
WHERE s.shop_id IS NULL;
```

### Option 3: Script PHP/Artisan (Recommandé pour Production)

Créer une commande Artisan pour une migration sécurisée:

```bash
php artisan make:command AssignSuppliersToShops
```

**app/Console/Commands/AssignSuppliersToShops.php**:
```php
<?php

namespace App\Console\Commands;

use App\Models\Supplier;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Console\Command;

class AssignSuppliersToShops extends Command
{
    protected $signature = 'suppliers:assign-shops {--user-id=}';
    protected $description = 'Assign suppliers without shop_id to appropriate shops';

    public function handle()
    {
        // Trouver les fournisseurs sans boutique
        $suppliersWithoutShop = Supplier::whereNull('shop_id')->count();
        
        if ($suppliersWithoutShop === 0) {
            $this->info('✅ Tous les fournisseurs ont déjà une boutique assignée.');
            return 0;
        }

        $this->warn("⚠️  {$suppliersWithoutShop} fournisseur(s) sans boutique trouvé(s).");

        // Option 1: Assigner à un utilisateur spécifique
        if ($userId = $this->option('user-id')) {
            $user = User::findOrFail($userId);
            $shop = $user->shops()->first();

            if (!$shop) {
                $this->error("❌ L'utilisateur #{$userId} n'a pas de boutique.");
                return 1;
            }

            $this->info("Assignation à la boutique: {$shop->name} (ID: {$shop->id})");
            
            if ($this->confirm('Continuer?')) {
                Supplier::whereNull('shop_id')
                    ->update(['shop_id' => $shop->id]);
                
                $this->info("✅ {$suppliersWithoutShop} fournisseur(s) assigné(s) avec succès!");
                return 0;
            }
        }

        // Option 2: Mode interactif
        $this->info("\n📋 Boutiques disponibles:");
        $shops = Shop::with('user')->get();
        
        foreach ($shops as $shop) {
            $this->line("  [{$shop->id}] {$shop->name} (Propriétaire: {$shop->user->name})");
        }

        $shopId = $this->ask('ID de la boutique à assigner');
        $shop = Shop::find($shopId);

        if (!$shop) {
            $this->error("❌ Boutique #{$shopId} introuvable.");
            return 1;
        }

        $this->info("\nVous allez assigner {$suppliersWithoutShop} fournisseur(s) à: {$shop->name}");
        
        if ($this->confirm('Confirmer?')) {
            Supplier::whereNull('shop_id')
                ->update(['shop_id' => $shop->id]);
            
            $this->info("✅ Migration terminée avec succès!");
            return 0;
        }

        $this->warn('❌ Opération annulée.');
        return 0;
    }
}
```

**Utilisation**:
```bash
# Mode interactif
php artisan suppliers:assign-shops

# Assigner directement à l'utilisateur ID 1
php artisan suppliers:assign-shops --user-id=1
```

### Option 4: Via Tinker (Rapide pour Dev)

```bash
php artisan tinker
```

```php
// Voir les fournisseurs sans boutique
Supplier::whereNull('shop_id')->get(['id', 'name']);

// Assigner à la boutique ID 1
Supplier::whereNull('shop_id')->update(['shop_id' => 1]);

// Vérifier
Supplier::whereNull('shop_id')->count();  // Devrait retourner 0
```

---

## 🔍 Vérifications Post-Migration

### 1. Vérifier qu'aucun fournisseur n'a shop_id NULL
```sql
SELECT COUNT(*) as orphans 
FROM suppliers 
WHERE shop_id IS NULL;
-- Résultat attendu: 0
```

### 2. Vérifier l'intégrité des données
```sql
-- Tous les fournisseurs doivent avoir un shop_id valide
SELECT s.id, s.name, s.shop_id, sh.name as shop_name
FROM suppliers s
LEFT JOIN shops sh ON s.shop_id = sh.id
WHERE s.shop_id IS NOT NULL;
```

### 3. Test dans l'Application
1. Connectez-vous à l'application
2. Accédez à **Fournisseurs** → Liste
3. Vérifiez que TOUS vos fournisseurs sont visibles
4. Essayez de créer un nouveau fournisseur
5. Vérifiez qu'il est bien assigné à votre boutique

---

## ⚠️ Points d'Attention

### Avant la Migration
- ✅ **Sauvegarde obligatoire**: `mysqldump` ou export de la base
- ✅ Vérifier les utilisateurs et leurs boutiques
- ✅ Tester sur un environnement de développement d'abord

### Pendant la Migration
- ⚠️ Ne pas exécuter en production sans backup
- ⚠️ S'assurer qu'aucun utilisateur n'est connecté
- ⚠️ Vérifier que shop_id correspond à un shop existant

### Après la Migration
- ✅ Vérifier le count des fournisseurs (doit être identique)
- ✅ Tester la création d'un nouveau fournisseur
- ✅ Tester la modification d'un fournisseur existant
- ✅ Vérifier que le filtrage multi-tenant fonctionne

---

## 🛠️ Commandes Utiles

```bash
# Voir les fournisseurs orphelins
php artisan tinker
>>> Supplier::whereNull('shop_id')->count();

# Voir les boutiques disponibles
>>> Shop::select('id', 'name', 'user_id')->get();

# Assigner via SQL (méthode rapide)
mysql -u root -p batix_saas
> UPDATE suppliers SET shop_id = 1 WHERE shop_id IS NULL;

# Vérifier l'intégrité
>>> Supplier::all()->pluck('shop_id')->unique();
>>> Shop::all()->pluck('id');  // Les shop_id doivent tous exister ici
```

---

## 📊 Checklist de Migration

- [ ] Backup de la base de données effectué
- [ ] Nombre de fournisseurs avant migration noté: __________
- [ ] Shop ID cible identifié: __________
- [ ] Migration exécutée (SQL/Tinker/Artisan)
- [ ] Vérification: `SELECT COUNT(*) FROM suppliers WHERE shop_id IS NULL;` = 0
- [ ] Nombre de fournisseurs après migration: __________
- [ ] Test création nouveau fournisseur: ✅
- [ ] Test modification fournisseur existant: ✅
- [ ] Test suppression fournisseur: ✅
- [ ] Vérification visibilité dans l'interface: ✅

---

## 🚨 En Cas de Problème

### Les fournisseurs ne s'affichent pas
```php
// Vérifier le filtrage
Supplier::with('shop')->get();  // Sans filtre
Supplier::whereHas('shop', fn($q) => $q->where('user_id', 1))->get();  // Avec filtre
```

### Erreur de clé étrangère
```sql
-- Vérifier que tous les shop_id existent
SELECT s.id, s.shop_id 
FROM suppliers s
LEFT JOIN shops sh ON s.shop_id = sh.id
WHERE sh.id IS NULL AND s.shop_id IS NOT NULL;
```

### Rollback si nécessaire
```sql
-- ATTENTION: Ne fait que restaurer shop_id à NULL
UPDATE suppliers SET shop_id = NULL;

-- Restaurer depuis backup
mysql -u root -p batix_saas < backup_before_migration.sql
```

---

**Date de création**: 24 février 2026  
**Migration requise**: OUI - Obligatoire pour l'accès aux fournisseurs existants  
**Impact**: Les fournisseurs avec `shop_id = NULL` sont invisibles dans l'application
