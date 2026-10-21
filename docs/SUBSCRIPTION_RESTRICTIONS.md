# Système de Restrictions par Abonnement

## 📋 Vue d'ensemble

Le système de restrictions d'abonnement contrôle automatiquement les limites de boutiques et d'utilisateurs en fonction du plan d'abonnement souscrit par chaque compte super_admin.

## 🎯 Fonctionnement

### Principes de base

1. **Seuls les comptes `super_admin` sont soumis aux restrictions**
2. **Les `admin_platforme` ne sont pas concernés** (ils gèrent la plateforme)
3. **Les restrictions sont basées sur l'abonnement actif** (status: active ou trial)
4. **Blocage automatique** si les limites sont atteintes

### Types de limites

#### 1. Limite de boutiques (`max_shops`)
- Nombre maximum de boutiques qu'un compte peut créer
- `-1` = illimité
- Vérification lors de la création d'une nouvelle boutique

#### 2. Limite d'utilisateurs (`max_users`)
- Nombre maximum d'utilisateurs (y compris le super_admin)
- `-1` = illimité
- Vérification lors de la création d'un nouvel utilisateur

## 🔧 Composants techniques

### 1. Modèle User - Nouvelles méthodes

**Fichier :** `app/Models/User.php`

#### `activeSubscription()`
Récupère l'abonnement actif de l'utilisateur.

```php
$subscription = $user->activeSubscription();
// Retourne l'abonnement actif (active ou trial) non expiré
```

#### `canCreateShop()`
Vérifie si l'utilisateur peut créer une nouvelle boutique.

```php
if ($user->canCreateShop()) {
    // Création autorisée
} else {
    // Limite atteinte
}
```

#### `canCreateUser()`
Vérifie si l'utilisateur peut créer un nouvel utilisateur.

```php
if ($user->canCreateUser()) {
    // Création autorisée
} else {
    // Limite atteinte
}
```

#### `remainingShopSlots()`
Retourne le nombre de boutiques restantes.

```php
$remaining = $user->remainingShopSlots();
// Retourne: 0-N pour le nombre restant, -1 pour illimité
```

#### `remainingUserSlots()`
Retourne le nombre d'utilisateurs restants.

```php
$remaining = $user->remainingUserSlots();
// Retourne: 0-N pour le nombre restant, -1 pour illimité
```

#### `getSubscriptionLimits()`
Retourne toutes les informations sur les limites.

```php
$limits = $user->getSubscriptionLimits();
/*
Retourne:
[
    'has_subscription' => true,
    'plan_name' => 'Starter',
    'plan_slug' => 'starter',
    'max_shops' => 1,
    'max_users' => 3,
    'unlimited_shops' => false,
    'unlimited_users' => false,
    'current_shops' => 1,
    'current_users' => 2,
    'can_create_shop' => false,
    'can_create_user' => true,
    'remaining_shops' => 0,
    'remaining_users' => 1,
    'expires_at' => '2026-03-27',
    'status' => 'active',
]
*/
```

### 2. Middleware CheckSubscriptionLimits

**Fichier :** `app/Http/Middleware/CheckSubscriptionLimits.php`

#### Usage dans les routes

```php
// Boutiques
Route::post('boutiques', [ShopController::class, 'store'])
    ->middleware('subscription.limits:shop');

// Utilisateurs
Route::post('users', [UserController::class, 'store'])
    ->middleware('subscription.limits:user');
```

#### Paramètres
- `shop` - Vérifie les limites de boutiques
- `user` - Vérifie les limites d'utilisateurs

#### Comportement
- ✅ **Passe** si l'utilisateur peut créer (limite non atteinte)
- ❌ **Redirige** avec message d'erreur si limite atteinte
- ⏭️ **Ignore** pour les admin_platforme

### 3. Routes protégées

**Fichier :** `routes/web.php`

#### Boutiques
```php
// Seule la création est protégée
Route::post('boutiques', [ShopController::class, 'store'])
    ->name('shops.store')
    ->middleware('subscription.limits:shop');

// Les autres actions ne sont pas limitées
Route::get('boutiques', [ShopController::class, 'index']);
Route::get('boutiques/{shop}/edit', [ShopController::class, 'edit']);
// etc.
```

#### Utilisateurs
```php
// Seule la création est protégée
Route::post('users', [UserController::class, 'store'])
    ->name('users.store')
    ->middleware('subscription.limits:user');

// Les autres actions ne sont pas limitées
Route::get('users', [UserController::class, 'index']);
// etc.
```

### 4. Partage global via Inertia

**Fichier :** `app/Http/Middleware/HandleInertiaRequests.php`

Les informations d'abonnement sont automatiquement partagées avec toutes les pages :

```php
'subscription' => $user && $user->role === 'super_admin' 
    ? $user->getSubscriptionLimits()
    : null,
```

### 5. Composant React SubscriptionBanner

**Fichier :** `resources/js/Components/SubscriptionBanner.tsx`

#### Utilisation

```tsx
import SubscriptionBanner from '@/Components/SubscriptionBanner';

// Afficher les limites globales
<SubscriptionBanner />

// Afficher uniquement les limites de boutiques
<SubscriptionBanner type="shops" />

// Afficher uniquement les limites d'utilisateurs
<SubscriptionBanner type="users" />
```

#### Hook personnalisé

```tsx
import { useSubscriptionLimits } from '@/Components/SubscriptionBanner';

function MyComponent() {
    const subscription = useSubscriptionLimits();
    
    if (subscription?.can_create_shop) {
        // Afficher le bouton "Nouvelle boutique"
    }
}
```

## 🎨 Interface utilisateur

### Affichage des limites

Le composant `SubscriptionBanner` affiche :

1. **Nom du plan** et **statut** (Actif, Essai, etc.)
2. **Progression des boutiques** : X / Y boutiques utilisées
3. **Progression des utilisateurs** : X / Y utilisateurs
4. **Alertes** si limites atteintes
5. **Badges de couleur** :
   - 🟢 Vert (Emerald) : OK, capacité disponible
   - 🟡 Jaune (Amber) : Proche de la limite
   - 🔴 Rouge (Rose) : Limite atteinte

### Messages d'erreur

Quand une limite est atteinte, l'utilisateur voit :

```
❌ Limite de boutiques atteinte. Votre plan "Starter" autorise 1 boutique(s). 
   Veuillez mettre à niveau votre abonnement.
```

## 📊 Exemples de scénarios

### Scénario 1 : Plan Starter (1 boutique, 3 utilisateurs)

```php
// Utilisateur a déjà 1 boutique
$user->canCreateShop();          // false
$user->remainingShopSlots();     // 0

// Utilisateur a 2 utilisateurs (lui + 1 employé)
$user->canCreateUser();          // true
$user->remainingUserSlots();     // 1
```

### Scénario 2 : Plan Growth (3 boutiques, 10 utilisateurs)

```php
// Utilisateur a 2 boutiques
$user->canCreateShop();          // true
$user->remainingShopSlots();     // 1

// Utilisateur a 8 utilisateurs
$user->canCreateUser();          // true
$user->remainingUserSlots();     // 2 (proche de la limite → warning jaune)
```

### Scénario 3 : Plan Scale (illimité)

```php
// Plans illimités
$user->canCreateShop();          // true
$user->remainingShopSlots();     // -1 (illimité)

$user->canCreateUser();          // true
$user->remainingUserSlots();     // -1 (illimité)
```

## 🚀 Workflow de création

### Création d'une boutique

```
1. User clique sur "Nouvelle boutique"
2. Affiche le formulaire
3. User remplit et soumet
4. ⚡ Middleware CheckSubscriptionLimits:shop
   ├─ Vérifie activeSubscription()
   ├─ Vérifie canCreateShop()
   └─ ✅ Autorise ou ❌ Bloque
5. Si autorisé → ShopController::store()
6. Si bloqué → Redirect avec message d'erreur
```

### Création d'un utilisateur

```
1. User clique sur "Nouvel utilisateur"
2. Affiche le formulaire
3. User remplit et soumet
4. ⚡ Middleware CheckSubscriptionLimits:user
   ├─ Vérifie activeSubscription()
   ├─ Vérifie canCreateUser()
   └─ ✅ Autorise ou ❌ Bloque
5. Si autorisé → UserController::store()
6. Si bloqué → Redirect avec message d'erreur
```

## 🔒 Sécurité

### Points de contrôle

1. **Middleware côté serveur** - Protection principale (ne peut pas être contournée)
2. **Validation dans les contrôleurs** - Double vérification si nécessaire
3. **UI côté client** - Améliore l'UX en désactivant les boutons

### Bypass impossible

- Même si l'utilisateur modifie le frontend, le middleware bloquera
- Les routes sont explicitement protégées
- Pas de possibilité de contourner via API

## 📈 Mise à niveau

### Quand upgrader ?

L'utilisateur doit upgrader son plan si :
1. Limite de boutiques atteinte
2. Limite d'utilisateurs atteinte
3. Besoin de fonctionnalités premium (à implémenter)

### Comment upgrader ?

```php
// Dans le futur : page d'upgrade
Route::get('/upgrade', [SubscriptionController::class, 'showUpgrade'])
    ->name('subscription.upgrade');
```

## 🧪 Tests recommandés

### Tests unitaires

```php
// UserTest.php
public function test_user_can_create_shop_when_under_limit()
{
    $user = User::factory()->create();
    $subscription = Subscription::factory()->create([
        'user_id' => $user->id,
        'status' => 'active',
    ]);
    $subscription->plan->max_shops = 3;
    
    Shop::factory()->count(2)->create(['user_id' => $user->id]);
    
    $this->assertTrue($user->canCreateShop());
}

public function test_user_cannot_create_shop_when_limit_reached()
{
    // ...
    $this->assertFalse($user->canCreateShop());
}
```

### Tests d'intégration

```php
// ShopControllerTest.php
public function test_cannot_create_shop_when_limit_reached()
{
    $user = $this->createUserWithLimitReached();
    
    $response = $this->actingAs($user)
        ->post(route('shops.store'), [
            'name' => 'New Shop',
            // ...
        ]);
    
    $response->assertRedirect();
    $response->assertSessionHas('error');
}
```

## 📝 To-Do / Évolutions

- [ ] Page d'upgrade avec comparaison des plans
- [ ] Notifications par email avant expiration
- [ ] Alertes proactives quand 80% des limites sont atteintes
- [ ] Dashboard avec métriques d'utilisation
- [ ] API pour gérer les abonnements programmatiquement
- [ ] Webhooks pour les changements d'abonnement
- [ ] Trial automatique pour nouveaux comptes
- [ ] Downgrade avec gestion des ressources excédentaires

## 🐛 Dépannage

### "Aucun abonnement actif"

**Cause :** L'utilisateur n'a pas d'abonnement ou il a expiré.

**Solution :**
1. Créer un abonnement via admin plateforme
2. Ou assigner un plan d'essai

### Limites incorrectes affichées

**Cause :** Cache ou données incorrectes.

**Solution :**
```bash
php artisan cache:clear
php artisan config:clear
```

### Le middleware ne bloque pas

**Cause :** Middleware mal enregistré ou route non protégée.

**Solution :**
1. Vérifier `bootstrap/app.php` - alias du middleware
2. Vérifier `routes/web.php` - middleware sur la route POST
