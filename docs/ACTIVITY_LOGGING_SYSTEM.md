# 🕵️ Système d'Audit & Tracking des Activités

## 📋 Vue d'Ensemble

Le système d'audit permet de tracer toutes les actions effectuées par les utilisateurs dans l'application. Chaque création, modification, suppression, consultation est enregistrée avec tous les détails nécessaires pour l'analyse et la sécurité.

## ✨ Fonctionnalités

### 🎯 Principales Caractéristiques

1. **Traçabilité Complète** : Enregistrement de toutes les actions importantes
2. **Contexte Riche** : Utilisateur, boutique, compte, IP, user-agent
3. **Détails des Modifications** : Anciennes et nouvelles valeurs
4. **Recherche & Filtres** : Par utilisateur, action, date, type de ressource
5. **Performance** : Index optimisés pour recherches rapides
6. **Automatique** : Trait LogsActivity pour automatiser sur les modèles

### 🔐 Informations Capturées

```
📌 QUI : user_id, user_name, user_email, user_role
📍 OÙ : shop_id, shop_name, account_code
⚡ QUOI : action, description, subject_type, subject_id
📝 DÉTAILS : properties (old/new values, metadata)
🌐 TECHNIQUE : ip_address, user_agent, method, url, timestamp
```

## 🏗️ Architecture

### Table `activity_logs`

```sql
id bigint
user_id bigint (nullable, foreign)
user_name varchar
user_email varchar
user_role varchar
shop_id bigint (nullable, foreign)
shop_name varchar
account_code varchar
action varchar (create, update, delete, view, export, etc.)
description varchar
subject_type varchar (Model class name)
subject_id bigint (Model ID)
properties json (old/new values, metadata)
ip_address varchar(45)
user_agent text
method varchar (GET, POST, PUT, DELETE)
url text
created_at timestamp
updated_at timestamp

INDEX (user_id, created_at)
INDEX (shop_id, created_at)
INDEX (subject_type, subject_id)
INDEX (action)
INDEX (created_at)
```

### Modèle `ActivityLog`

**Fichier** : `app/Models/ActivityLog.php`

**Relations** :
- `belongsTo(User::class)` - Utilisateur qui a fait l'action
- `belongsTo(Shop::class)` - Boutique où l'action a été faite

**Scopes** :
- `forUser($userId)` - Filtrer par utilisateur
- `forShop($shopId)` - Filtrer par boutique
- `withAction($action)` - Filtrer par action
- `forSubjectType($type)` - Filtrer par type de ressource
- `betweenDates($start, $end)` - Filtrer par période
- `recent($limit)` - Activités récentes

**Accesseurs** :
- `action_label` - Label traduit de l'action
- `subject_label` - Label traduit du type de ressource

**Méthodes** :
- `getChangesSummary()` - Résumé des modifications

### Service `ActivityLogger`

**Fichier** : `app/Services/ActivityLogger.php`

**Méthodes Principales** :

```php
// Méthode générique
ActivityLogger::log($action, $description, $subject, $properties)

// Méthodes spécialisées
ActivityLogger::created($model, $description)
ActivityLogger::updated($model, $changes, $description)
ActivityLogger::deleted($model, $description)
ActivityLogger::viewed($model, $description)
ActivityLogger::exported($type, $count, $description)
ActivityLogger::imported($type, $count, $description)
ActivityLogger::login($description)
ActivityLogger::logout($description)
ActivityLogger::lockScreen($description)
ActivityLogger::unlockScreen($description)

// Récupération
ActivityLogger::recentForShop($limit)
ActivityLogger::recentForUser($limit)
ActivityLogger::forDateRange($startDate, $endDate, $shopId)
```

### Trait `LogsActivity`

**Fichier** : `app/Traits/LogsActivity.php`

**Usage** : Ajouter le trait aux modèles à surveiller

```php
class Product extends Model
{
    use LogsActivity;
    
    // Le logging est automatique sur create, update, delete
}
```

**Événements Capturés** :
- `created` - Lors de la création
- `updated` - Lors de la modification (avec détail des changements)
- `deleted` - Lors de la suppression

**Conditions** :
- Ne log que si l'utilisateur est authentifié
- Ne log pas pendant les commandes console (migrations, seeders)
- Ne log que si les données ont changé (pour update)

## 📦 Implémentation

### 1. Migration

**Fichier** : `database/migrations/2026_02_28_225008_create_activity_logs_table.php`

```bash
php artisan migrate
```

### 2. Ajouter le Trait aux Modèles

**Exemple** : `app/Models/Product.php`

```php
use App\Traits\LogsActivity;

class Product extends Model
{
    use LogsActivity;
    
    // Automatiquement loggé :
    // - Product::create() → action "create"
    // - $product->update() → action "update" avec changes
    // - $product->delete() → action "delete"
}
```

**Modèles Recommandés** :
- ✅ Product
- ✅ Category
- ✅ Customer
- ✅ Supplier
- ✅ Invoice
- ✅ Sale
- ✅ Shop
- ✅ User

### 3. Logging Manuel

**Dans un Contrôleur** :

```php
use App\Services\ActivityLogger;

// Création
$product = Product::create($data);
// Automatique si LogsActivity trait

// Action personnalisée
ActivityLogger::log(
    'price_update',
    "Modification du prix de {$product->name}",
    $product,
    ['old_price' => $oldPrice, 'new_price' => $newPrice]
);

// Export
ActivityLogger::exported('products', $count, "Exportation de {$count} produits");

// Consultation (pour ressources sensibles)
ActivityLogger::viewed($invoice, "Consultation de la facture #{$invoice->number}");
```

### 4. Intégration Authentification

**Déjà Implémenté** :

- ✅ `AuthenticatedSessionController::store()` - Log login
- ✅ `AuthenticatedSessionController::destroy()` - Log logout
- ✅ `LockScreenController::lock()` - Log verrouillage
- ✅ `LockScreenController::unlock()` - Log déverrouillage

## 🎨 Interface Utilisateur

### Route

**Fichier** : `routes/web.php`

```php
Route::get('activity-logs', [ActivityLogController::class, 'index'])
    ->name('activity-logs.index');

Route::get('activity-logs/{activityLog}', [ActivityLogController::class, 'show'])
    ->name('activity-logs.show');
```

### Contrôleur

**Fichier** : `app/Http/Controllers/ActivityLogController.php`

**Méthodes** :
- `index()` - Liste paginée avec filtres
- `show()` - Détail d'une activité

**Filtres Disponibles** :
- Par utilisateur (`user_id`)
- Par action (`action`)
- Par type de ressource (`subject_type`)
- Par période (`start_date`, `end_date`)
- Par recherche textuelle (`search`)

**Permissions** :
- **Manager/Employee** : Voit uniquement sa boutique
- **Super Admin** : Voit toutes ses boutiques
- **Admin Plateforme** : Voit tout

### Interface React

**À Créer** : `resources/js/Pages/ActivityLogs/Index.tsx`

**Éléments** :
- 📊 Tableau paginé des activités
- 🔍 Filtres (utilisateur, action, période, recherche)
- 🎨 Badge coloré par type d'action
- 👤 Avatar et nom de l'utilisateur
- ⏱️ Timestamp relatif et absolu
- 🔗 Lien vers détail de l'activité
- 📱 Responsive design

**Colonnes Suggérées** :
1. Utilisateur (avatar + nom)
2. Action (badge)
3. Description
4. Ressource
5. Boutique
6. Date/Heure
7. Actions (voir détail)

## 🔍 Exemples d'Utilisation

### Exemple 1 : Produit Modifié

```php
// Le trait LogsActivity automatise
$product->update(['price' => 150]);

// Enregistre :
{
    "user_id": 5,
    "user_name": "John Doe",
    "action": "update",
    "description": "Modification d'un(e) Product",
    "subject_type": "App\\Models\\Product",
    "subject_id": 42,
    "properties": {
        "changes": {
            "price": {
                "old": 100,
                "new": 150
            }
        }
    }
}
```

### Exemple 2 : Exportation

```php
ActivityLogger::exported('invoices', 50);

// Enregistre :
{
    "action": "export",
    "description": "Exportation de 50 invoices",
    "properties": {
        "type": "invoices",
        "count": 50
    }
}
```

### Exemple 3 : Connexion

```php
// Automatique dans AuthenticatedSessionController
ActivityLogger::login();

// Enregistre :
{
    "user_id": 5,
    "user_name": "John Doe",
    "action": "login",
    "description": "Connexion à la plateforme",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
}
```

## 📊 Rapports & Analyses

### Activités par Utilisateur

```php
$activities = ActivityLog::forUser($userId)
    ->betweenDates($startDate, $endDate)
    ->with('shop')
    ->get();
```

### Top Actions

```php
$topActions = ActivityLog::forShop($shopId)
    ->betweenDates($startDate, $endDate)
    ->selectRaw('action, COUNT(*) as count')
    ->groupBy('action')
    ->orderBy('count', 'desc')
    ->get();
```

### Activités Récentes

```php
$recent = ActivityLogger::recentForShop(20);
```

### Modifications d'un Produit

```php
$history = ActivityLog::forSubjectType(Product::class)
    ->where('subject_id', $productId)
    ->withAction('update')
    ->latest()
    ->get();
```

## 🔐 Sécurité & Privacy

### Données Sensibles

**Ne PAS logger** :
- ❌ Mots de passe
- ❌ Tokens d'authentification
- ❌ Numéros de carte bancaire
- ❌ Données personnelles sensibles (santé, religion, etc.)

**Filtrer avant logging** :

```php
$safeData = collect($data)->except([
    'password',
    'password_confirmation',
    'remember_token',
    'api_token'
])->toArray();

ActivityLogger::log('update', 'Modification profil', $user, ['changes' => $safeData]);
```

### Rétention des Logs

**Recommandation** : Supprimer les logs après X mois

```php
// Dans un Command planifié
ActivityLog::where('created_at', '<', now()->subMonths(6))->delete();
```

**Fichier** : `app/Console/Commands/CleanOldActivityLogs.php`

```php
<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use Illuminate\Console\Command;

class CleanOldActivityLogs extends Command
{
    protected $signature = 'activity-logs:clean {--months=6}';
    protected $description = 'Supprimer les logs d\'activité de plus de X mois';

    public function handle()
    {
        $months = $this->option('months');
        $date = now()->subMonths($months);
        
        $count = ActivityLog::where('created_at', '<', $date)->count();
        
        if ($this->confirm("Supprimer {$count} logs de plus de {$months} mois ?")) {
            ActivityLog::where('created_at', '<', $date)->delete();
            $this->info("✅ {$count} logs supprimés");
        }
    }
}
```

**Planification** : `app/Console/Kernel.php`

```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('activity-logs:clean --months=6')
        ->monthly()
        ->at('01:00');
}
```

## 🧪 Tests

### Test Manuel

```php
// Dans tinker
php artisan tinker

// Créer un log
ActivityLogger::log('test', 'Test du système d\'audit');

// Récupérer
ActivityLog::latest()->first();

// Avec un produit
$product = Product::first();
ActivityLogger::created($product);
```

### Test Unitaire

**Fichier** : `tests/Feature/ActivityLogTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\ActivityLog;
use App\Services\ActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_logs_login_activity()
    {
        $user = User::factory()->create();
        
        $this->actingAs($user);
        ActivityLogger::login();
        
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $user->id,
            'action' => 'login',
        ]);
    }

    public function test_logs_product_creation()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        $product = Product::factory()->create();
        
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $user->id,
            'action' => 'create',
            'subject_type' => Product::class,
            'subject_id' => $product->id,
        ]);
    }

    public function test_logs_product_update_with_changes()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        
        $product = Product::factory()->create(['price' => 100]);
        $product->update(['price' => 150]);
        
        $log = ActivityLog::where('subject_id', $product->id)
            ->where('action', 'update')
            ->first();
            
        $this->assertNotNull($log);
        $this->assertEquals(100, $log->properties['changes']['price']['old']);
        $this->assertEquals(150, $log->properties['changes']['price']['new']);
    }
}
```

## 📝 Documentation Complémentaire

### Actions Disponibles

| Action | Description | Usage |
|--------|-------------|-------|
| `create` | Création d'une ressource | Automatique avec trait |
| `update` | Modification d'une ressource | Automatique avec trait |
| `delete` | Suppression d'une ressource | Automatique avec trait |
| `view` | Consultation d'une ressource | Manuel |
| `export` | Exportation de données | Manuel |
| `import` | Importation de données | Manuel |
| `login` | Connexion utilisateur | Automatique |
| `logout` | Déconnexion utilisateur | Automatique |
| `lock` | Verrouillage d'écran | Automatique |
| `unlock` | Déverrouillage d'écran | Automatique |
| `restore` | Restauration (soft delete) | Manuel |

### Performance

**Index Créés** :
- `(user_id, created_at)` - Activités d'un utilisateur
- `(shop_id, created_at)` - Activités d'une boutique
- `(subject_type, subject_id)` - Historique d'une ressource
- `(action)` - Filtrer par action
- `(created_at)` - Tri chronologique

**Optimisations** :
- ✅ Pagination pour éviter surcharge mémoire
- ✅ Index composés pour recherches complexes
- ✅ Eager loading des relations (user, shop)
- ✅ Nettoyage automatique des vieux logs

## 🎯 Checklist d'Implémentation

- [x] Migration `activity_logs` table
- [x] Modèle `ActivityLog`
- [x] Service `ActivityLogger`
- [x] Trait `LogsActivity`
- [x] Helper `should_log_activity()`
- [x] Contrôleur `ActivityLogController`
- [x] Routes activity-logs
- [x] Intégration login/logout
- [x] Intégration lock/unlock
- [ ] Interface React Index
- [ ] Interface React Show
- [ ] Ajouter trait aux modèles
- [ ] Command de nettoyage
- [ ] Tests unitaires
- [ ] Documentation utilisateur

## 🚀 Prochaines Étapes

1. **Créer l'interface React** pour visualiser les logs
2. **Ajouter le trait LogsActivity** aux modèles importants
3. **Créer la commande** de nettoyage des vieux logs
4. **Planifier** le nettoyage automatique
5. **Tester** avec des données réelles

---

**Date de création** : 28 février 2026  
**Statut** : Backend complet ✅ | Frontend à créer 🔄
