# 🔐 Correction: Policy Manquante pour les Boutiques

## Date: 24 février 2026

## 🐛 Problème Identifié

### Symptôme
L'utilisateur ne pouvait pas :
- ❌ Voir le détail d'une boutique (`shops.show`)
- ❌ Modifier une boutique (`shops.edit` / `shops.update`)
- ❌ Supprimer une boutique (`shops.destroy`)

### Erreur
```
This action is unauthorized.
```

---

## 🔍 Cause Racine

Le **ShopController** utilise `$this->authorize()` dans plusieurs méthodes :

```php
// ShopController.php

public function show(Shop $shop)
{
    $this->authorize('view', $shop);  // ❌ Policy manquante
    // ...
}

public function edit(Shop $shop)
{
    $this->authorize('update', $shop);  // ❌ Policy manquante
    // ...
}

public function update(Request $request, Shop $shop)
{
    $this->authorize('update', $shop);  // ❌ Policy manquante
    // ...
}

public function destroy(Shop $shop)
{
    $this->authorize('delete', $shop);  // ❌ Policy manquante
    // ...
}
```

**Problème** : La classe `ShopPolicy` n'existait pas dans `app/Policies/`

---

## ✅ Solution Appliquée

### Fichier Créé

**`app/Policies/ShopPolicy.php`**

```php
<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class ShopPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Shop $shop): bool
    {
        return $user->id === $shop->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Shop $shop): bool
    {
        return $user->id === $shop->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Shop $shop): bool
    {
        return $user->id === $shop->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Shop $shop): bool
    {
        return $user->id === $shop->user_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Shop $shop): bool
    {
        return $user->id === $shop->user_id;
    }
}
```

---

## 🧪 Tests de Validation

### Test 1: Utilisateur avec sa propre boutique ✅

```php
$user1 = User::find(1);  // User ID: 1
$shop1 = Shop::find(1);  // Shop avec user_id: 1

$user1->can('view', $shop1);    // ✅ OUI
$user1->can('update', $shop1);  // ✅ OUI
$user1->can('delete', $shop1);  // ✅ OUI
```

### Test 2: Utilisateur avec boutique d'un autre ✅

```php
$user1 = User::find(1);  // User ID: 1
$shop2 = Shop::find(2);  // Shop avec user_id: 2

$user1->can('view', $shop2);    // ✅ NON
$user1->can('update', $shop2);  // ✅ NON
$user1->can('delete', $shop2);  // ✅ NON
```

**Résultat**: La Policy fonctionne correctement ! ✅

---

## 📋 Règles d'Autorisation

### Pour toutes les actions (view, update, delete, restore, forceDelete)

```php
return $user->id === $shop->user_id;
```

**Règle simple** : L'utilisateur peut uniquement agir sur **ses propres boutiques**.

### Actions toujours autorisées

- `viewAny()` : Voir la liste → ✅ Toujours autorisé (filtrage fait dans le contrôleur)
- `create()` : Créer une boutique → ✅ Toujours autorisé

---

## 🔐 Sécurité Multi-Tenancy

### Couche 1: Query Filtering
```php
// Dans ShopController::index()
$shops = Auth::user()->accessibleShopsQuery()->latest()->get();
```
→ Les utilisateurs ne voient **que leurs boutiques** dans la liste

### Couche 2: Authorization Policy (NOUVELLE)
```php
// Dans ShopController::show(), edit(), update(), destroy()
$this->authorize('view', $shop);
```
→ Même si quelqu'un essaie d'accéder directement par URL, la Policy bloque l'accès

### Résultat: Double Protection ✅

1. **Filtrage des requêtes** : N'affiche que les boutiques de l'utilisateur
2. **Vérification d'autorisation** : Empêche l'accès direct par URL à une boutique d'autrui

---

## 🎯 Impact de la Correction

### Avant ❌
- Impossible de voir le détail d'une boutique
- Impossible de modifier une boutique
- Impossible de supprimer une boutique
- Message d'erreur : "This action is unauthorized"

### Après ✅
- ✅ Affichage du détail de **ses propres** boutiques
- ✅ Modification de **ses propres** boutiques
- ✅ Suppression de **ses propres** boutiques
- ✅ Blocage automatique pour les boutiques des autres utilisateurs

---

## 📁 Fichiers Modifiés

1. **Nouveau** : `app/Policies/ShopPolicy.php` - Policy créée

---

## 🔄 Auto-Découverte des Policies (Laravel 11)

Laravel 11 découvre automatiquement les policies si elles suivent la convention :

- **Modèle** : `App\Models\Shop`
- **Policy** : `App\Policies\ShopPolicy`

✅ Pas besoin d'enregistrer manuellement dans `AuthServiceProvider`

---

## ✅ Checklist de Vérification

- [x] ShopPolicy créée
- [x] Méthodes view, update, delete implémentées
- [x] Tests de permissions réussis
- [x] User peut voir ses propres boutiques
- [x] User ne peut PAS voir les boutiques des autres
- [x] Auto-découverte fonctionne (Laravel 11)

---

## 🚀 Prochaines Étapes Recommandées

### Autres Modèles à Vérifier

Vérifier que TOUS les modèles ont leur Policy :

1. ✅ `CategoryPolicy` - Existe
2. ✅ `ProductPolicy` - Existe
3. ✅ `SubcategoryPolicy` - Existe
4. ✅ `ShopPolicy` - **Créée aujourd'hui**
5. ❓ `SupplierPolicy` - À vérifier
6. ❓ `CustomerPolicy` - À vérifier
7. ❓ `SalePolicy` - À vérifier
8. ❓ `InvoicePolicy` - À vérifier
9. ❓ `StockMovementPolicy` - À vérifier
10. ❓ `InventoryPolicy` - À vérifier

### Commande de Vérification

```bash
# Lister tous les modèles
ls -1 app/Models/*.php | xargs -n1 basename | sed 's/.php//'

# Lister toutes les policies
ls -1 app/Policies/*.php | xargs -n1 basename | sed 's/Policy.php//'

# Comparer les deux listes
```

---

## 📝 Notes Importantes

1. **Toutes les policies doivent vérifier** : `$user->id === $resource->shop->user_id` ou `$user->id === $resource->user_id`

2. **Pattern de sécurité à 2 couches** :
   - Filtrage dans `index()` avec `whereHas('shop')`
   - Authorization dans `show()`, `edit()`, `update()`, `destroy()` avec `authorize()`

3. **Tests manuels recommandés** :
   ```bash
   php artisan tinker
   >>> $user = User::find(1);
   >>> $shop = Shop::find(2);  // Boutique d'un autre user
   >>> $user->can('view', $shop);  // Doit retourner false
   ```

---

**Date de création** : 24 février 2026  
**Problème résolu** : Policy manquante pour Shop  
**Impact** : HAUTE - Fonctionnalité critique restaurée  
**Statut** : ✅ RÉSOLU ET TESTÉ
