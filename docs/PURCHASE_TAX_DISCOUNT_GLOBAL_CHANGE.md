# 📝 Modification: Taxes et Remises Globales

**Date**: 2 mars 2026  
**Type**: Correction fonctionnelle

## 🔄 Changement effectué

Les taxes et remises ont été déplacées du niveau **article** au niveau **global** du bon de commande.

### Avant
- ❌ Chaque article avait son propre taux de taxe et remise
- ❌ Calcul complexe par ligne
- ❌ Difficile à gérer pour l'utilisateur

### Après  
- ✅ Un seul taux de taxe global pour tout le bon de commande
- ✅ Un seul taux de remise global pour tout le bon de commande
- ✅ Calcul simplifié : Sous-total → Remise → Taxe → Total
- ✅ Plus facile et plus logique pour l'utilisateur

## 📋 Fichiers modifiés

### 1. Frontend (React/TypeScript)

#### `resources/js/Pages/Purchases/Create.tsx`
**Modifications**:
- ✅ Supprimé `tax_rate` et `discount_rate` de l'interface `PurchaseItem`
- ✅ Ajouté `tax_rate` et `discount_rate` au niveau du formulaire global (`useForm`)
- ✅ Supprimé les champs de taxe et remise par ligne dans la section Articles
- ✅ Ajouté les champs de taxe et remise globales dans la section Récapitulatif
- ✅ Modifié les calculs: 
  - Total ligne = quantité × prix (simple multiplication)
  - Sous-total = somme des totaux de ligne
  - Remise = sous-total × (taux_remise_global / 100)
  - Taxe = (sous-total - remise) × (taux_taxe_global / 100)
  - Total = sous-total - remise + taxe + frais_port

#### `resources/js/Pages/Purchases/Edit.tsx`
**Modifications identiques à Create.tsx**:
- ✅ Interface `PurchaseItem` simplifiée
- ✅ Récupération des taux globaux depuis le premier item (backwards compatibility)
- ✅ Champs de taxe et remise dans le récapitulatif
- ✅ Calculs globaux identiques

### 2. Backend (Laravel)

#### `app/Http/Controllers/PurchaseController.php`

**Méthode `store()`**:
```php
// Validation mise à jour
'tax_rate' => 'nullable|numeric|min:0|max:100',
'discount_rate' => 'nullable|numeric|min:0|max:100',
// Supprimé de items.*

// Logique mise à jour
$globalTaxRate = $validated['tax_rate'] ?? 0;
$globalDiscountRate = $validated['discount_rate'] ?? 0;

// Appliqué à tous les items
foreach ($validated['items'] as $item) {
    PurchaseItem::create([
        // ...
        'tax_rate' => $globalTaxRate,
        'discount_rate' => $globalDiscountRate,
        // ...
    ]);
}
```

**Méthode `update()`**:
- ✅ Validation identique à `store()`
- ✅ Logique d'application des taux globaux identique

## 🧮 Nouveau calcul

### Formule simplifiée
```
1. Sous-total = Σ (quantité × prix_unitaire) pour tous les articles
2. Montant remise = Sous-total × (taux_remise_global / 100)
3. Sous-total après remise = Sous-total - Montant remise
4. Montant taxe = Sous-total après remise × (taux_taxe_global / 100)
5. Total général = Sous-total après remise + Montant taxe + Frais de port
```

### Exemple concret
```
Articles:
- Article 1: 10 × 100€ = 1 000€
- Article 2: 5 × 50€ = 250€

Sous-total: 1 250€
Remise globale (10%): -125€
Sous-total après remise: 1 125€
Taxe globale (20%): +225€
Frais de port: 50€
─────────────────────
Total: 1 400€
```

## 💾 Structure de données

### Base de données (inchangée)
La structure de la table `purchase_items` reste inchangée. Les colonnes `tax_rate` et `discount_rate` existent toujours mais:
- **Avant**: Valeur différente par article
- **Maintenant**: Même valeur pour tous les articles d'un même bon de commande

Le modèle `PurchaseItem` continue de calculer automatiquement les montants dans son hook `boot()`.

## ✅ Avantages de cette modification

1. **UX simplifiée**: L'utilisateur n'a plus à saisir les taux pour chaque article
2. **Logique métier standard**: La plupart des entreprises appliquent une taxe et remise globales
3. **Calculs plus clairs**: Plus facile à comprendre et à vérifier
4. **Moins d'erreurs**: Réduction des risques d'erreur de saisie
5. **Performance**: Moins de calculs côté frontend

## 🧪 Tests recommandés

### Test 1: Création de bon de commande
1. Créer un BC avec 3 articles
2. Définir une remise globale de 10%
3. Définir une taxe globale de 20%
4. Vérifier que les calculs sont corrects
5. Vérifier que tous les items ont les mêmes taux

### Test 2: Modification
1. Modifier un BC en brouillon
2. Changer le taux de remise
3. Ajouter/supprimer des articles
4. Vérifier le recalcul

### Test 3: Cas limites
1. BC avec remise = 0% et taxe = 0%
2. BC avec remise = 100%
3. BC avec 1 seul article
4. BC avec beaucoup d'articles

## 🔄 Backwards Compatibility

### Édition des anciens bons de commande
Dans `Edit.tsx`, les taux sont récupérés depuis le premier item:
```typescript
tax_rate: parseFloat(purchase.items[0]?.tax_rate || '0'),
discount_rate: parseFloat(purchase.items[0]?.discount_rate || '0'),
```

Cela signifie que les anciens BC (créés avec des taux par article) pourront toujours être édités, mais utiliseront le taux du premier article comme taux global.

### Affichage des anciens BC
La page `Show.tsx` n'a pas été modifiée car elle affiche les données telles qu'elles sont stockées. Les anciens BC avec différents taux par article s'afficheront correctement.

## 📝 Notes techniques

### Aucune migration nécessaire
- La structure de la base de données n'a pas changé
- Les colonnes `tax_rate` et `discount_rate` dans `purchase_items` sont toujours utilisées
- Seule la façon de remplir ces colonnes a changé (valeur unique au lieu de valeurs multiples)

### Le modèle PurchaseItem est inchangé
Le hook `boot()` qui calcule automatiquement les montants fonctionne toujours:
```php
// Toujours actif
static::saving(function ($item) {
    $item->subtotal = $item->quantity_ordered * $item->unit_price;
    $item->discount_amount = $item->subtotal * ($item->discount_rate / 100);
    // ...
});
```

## 🚀 Prochaines étapes possibles

1. **Migration optionnelle**: Créer une migration pour unifier les taux des anciens BC
2. **Validation**: Ajouter un message si les items ont des taux différents (détection d'anciennes données)
3. **Reporting**: Mettre à jour les rapports pour refléter le nouveau système

---

**Status**: ✅ Complété  
**Impact**: Amélioration UX majeure  
**Breaking Changes**: Aucun (backwards compatible)
