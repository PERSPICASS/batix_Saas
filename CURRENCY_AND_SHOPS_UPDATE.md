# 🔄 Mise à jour du système de devises et des boutiques accessibles

## Date: 24 février 2026

## Résumé des modifications

### 1. Remplacement des symboles de devises hardcodés ✅

Tous les affichages de prix avec des symboles hardcodés (€, $, DH, CFA) ont été remplacés par le composant `<Currency>` dynamique dans les fichiers suivants:

#### Pages modifiées:
- ✅ **Sales/Create.tsx** (6 occurrences) - Prix produits, sous-total, TVA, total, monnaie à rendre
- ✅ **Sales/Show.tsx** (8 occurrences) - Détails de vente avec tous les montants
- ✅ **Sales/Index.tsx** (2 occurrences) - Statistiques et liste des ventes  
- ✅ **Invoices/Create.tsx** (3 occurrences) - Sous-total, TVA, total
- ✅ **Customers/Index.tsx** (1 occurrence) - Total achats clients
- ✅ **Suppliers/Show.tsx** (1 occurrence) - Prix des produits
- ✅ **Shops/Create.tsx** - Devise par défaut changée de 'MAD' à 'USD'

**Total: 21 occurrences remplacées**

### 2. Correction du système de boutiques accessibles ✅

#### Problème identifié:
Les utilisateurs non super_admin ne voyaient pas leurs boutiques car le système utilisait `Auth::user()->shops` qui retourne uniquement les boutiques **créées** par l'utilisateur (relation `hasMany`), alors que les utilisateurs normaux ont un `shop_id` (relation `belongsTo`).

#### Solution implémentée:

##### A. Nouvelles méthodes dans le modèle User (`app/Models/User.php`):

```php
/**
 * Get accessible shops for the user.
 * Super admin gets all their shops, regular users get only their assigned shop.
 */
public function accessibleShops()
{
    if ($this->role === 'super_admin') {
        return $this->shops;
    }
    
    return $this->shop ? collect([$this->shop]) : collect([]);
}

/**
 * Get query builder for accessible shops.
 * Used for finding/validating shop ownership.
 */
public function accessibleShopsQuery()
{
    if ($this->role === 'super_admin') {
        return $this->shops();
    }
    
    // For non-super-admin, return a query that only matches their shop
    return Shop::where('id', $this->shop_id);
}
```

##### B. Contrôleurs mis à jour:

Tous les contrôleurs ont été mis à jour pour utiliser les nouvelles méthodes:

1. **SaleController.php** ✅
   - `index()`: `Auth::user()->accessibleShops()`
   - `create()`: `Auth::user()->accessibleShops()`
   - `store()`: `Auth::user()->accessibleShopsQuery()->findOrFail()`

2. **CategoryController.php** ✅
   - `index()`, `create()`, `edit()`: `accessibleShops()`
   - `store()`: `accessibleShopsQuery()->findOrFail()`

3. **ProductController.php** ✅
   - Toutes les méthodes mises à jour

4. **CustomerController.php** ✅
   - Toutes les méthodes mises à jour

5. **InvoiceController.php** ✅
   - Toutes les méthodes mises à jour

6. **ShopController.php** ✅
   - `index()`: `accessibleShopsQuery()->latest()->get()`
   - `store()`: `accessibleShopsQuery()->create()`

7. **SubcategoryController.php** ✅
   - Méthodes mises à jour

### 3. Comportement attendu

#### Pour Super Admin (`role = 'super_admin'`):
- ✅ Voit toutes les boutiques qu'il a créées
- ✅ Peut gérer plusieurs boutiques
- ✅ Accès complet à toutes ses boutiques

#### Pour Utilisateurs Normaux:
- ✅ Voit uniquement **SA** boutique (définie par `shop_id`)
- ✅ Ne peut pas accéder aux autres boutiques
- ✅ Interface adaptée à une seule boutique

### 4. Tests recommandés

1. **Test avec super_admin**:
   - [ ] Créer une nouvelle vente → doit voir toutes ses boutiques
   - [ ] Voir la liste des ventes → filtre par boutiques
   - [ ] Créer un produit → choisir parmi ses boutiques

2. **Test avec utilisateur normal**:
   - [ ] Créer une nouvelle vente → doit voir uniquement sa boutique
   - [ ] Voir ses produits → uniquement ceux de sa boutique
   - [ ] Tenter d'accéder à une autre boutique → 404

3. **Test des devises**:
   - [ ] Changer la devise dans `/parametres`
   - [ ] Vérifier que TOUS les prix s'affichent avec la nouvelle devise
   - [ ] Tester avec USD ($), EUR (€), XOF (CFA)

### 5. Fichiers créés/modifiés

#### Modèles:
- `app/Models/User.php` - Ajout de `accessibleShops()` et `accessibleShopsQuery()`

#### Contrôleurs (7 fichiers):
- `app/Http/Controllers/SaleController.php`
- `app/Http/Controllers/CategoryController.php`
- `app/Http/Controllers/ProductController.php`
- `app/Http/Controllers/CustomerController.php`
- `app/Http/Controllers/InvoiceController.php`
- `app/Http/Controllers/ShopController.php`
- `app/Http/Controllers/SubcategoryController.php`

#### Pages React/TypeScript (7 fichiers):
- `resources/js/Pages/Sales/Create.tsx`
- `resources/js/Pages/Sales/Show.tsx`
- `resources/js/Pages/Sales/Index.tsx`
- `resources/js/Pages/Invoices/Create.tsx`
- `resources/js/Pages/Customers/Index.tsx`
- `resources/js/Pages/Suppliers/Show.tsx`
- `resources/js/Pages/Shops/Create.tsx`

### 6. Commandes de vérification

```bash
# Vérifier qu'il ne reste plus de Auth::user()->shops hardcodés
grep -rn "Auth::user()->shops" app/Http/Controllers/

# Vérifier qu'il ne reste plus de symboles de devises hardcodés
grep -rn "toFixed(2).*€\|toFixed(2).*\$\|toFixed(2).*DH" resources/js/Pages/
```

### 7. Documentation associée

- **CURRENCY_SYSTEM_GUIDE.md** - Guide complet du système de devises
- **TOAST_AND_DIALOG_GUIDE.md** - Guide des notifications

---

## 🎯 Résultat final

✅ **Système de devises 100% dynamique** - Tous les prix s'adaptent automatiquement  
✅ **Multi-tenancy correct** - Chaque utilisateur voit uniquement ses boutiques autorisées  
✅ **Code maintenable** - Logique centralisée dans le modèle User  
✅ **Aucun hardcoding** - Tout est paramétrable via `/parametres`
