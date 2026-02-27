# Mise à jour de la Landing Page avec les Plans Dynamiques

## 📋 Vue d'ensemble

La landing page a été mise à jour pour afficher les **plans d'abonnement réels** provenant de la base de données, avec l'affichage des prix en **deux devises** (EUR et FCFA).

## ✅ Modifications apportées

### 1. Contrôleur Welcome

**Fichier créé :** `app/Http/Controllers/WelcomeController.php`

- Récupère les plans actifs depuis la base de données
- Trie les plans par prix croissant
- Expose toutes les propriétés nécessaires pour l'affichage

```php
$plans = SubscriptionPlan::where('is_active', true)
    ->orderBy('price', 'asc')
    ->get()
```

### 2. Route mise à jour

**Fichier :** `routes/web.php`

Changement de closure vers contrôleur :
```php
// Avant
Route::get('/', function () { ... });

// Après
Route::get('/', [WelcomeController::class, 'index']);
```

### 3. Modèle SubscriptionPlan enrichi

**Fichier :** `app/Models/SubscriptionPlan.php`

#### Nouveaux attributs ajoutés :
- `price_eur` - Prix en euros (sans décimales)
- `price_fcfa` - Prix en FCFA (sans décimales)
- `formatted_price` - Prix combiné avec HTML (pour d'autres usages)

#### Calcul automatique :
```php
// Taux de change fixe
1 EUR = 655.957 FCFA

// Exemples de conversion
15 000 FCFA → 23€
35 000 FCFA → 53€
75 000 FCFA → 114€
```

#### Formatage des prix :
- **Sans décimales** (0 chiffres après la virgule)
- **Séparateur de milliers** avec espace
- **Format :** `23€` et `15 000 FCFA`

### 4. Composant Welcome.tsx modernisé

**Fichier :** `resources/js/Pages/Welcome.tsx`

#### Interface TypeScript :
```typescript
interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    formatted_price: string;
    price_eur: string;      // Nouveau
    price_fcfa: string;     // Nouveau
    max_shops: number;
    max_users: number;
    features: string[];
    shop_limit_text: string;
    has_unlimited_shops: boolean;
    has_unlimited_users: boolean;
}
```

#### Affichage des prix (l'un sous l'autre) :
```tsx
<div className="mt-3 space-y-1">
    <p className="text-3xl font-bold text-white">{plan.price_eur}</p>
    <p className="text-2xl font-semibold text-amber-200">{plan.price_fcfa}</p>
</div>
<p className="mt-2 text-xs text-slate-400">{plan.subtitle}</p>
```

#### Plans statiques retirés :
Les anciens plans codés en dur (`plansByLocale`) ont été commentés car maintenant les plans viennent dynamiquement de la base de données.

## 🎨 Présentation visuelle

### Affichage des cartes de prix :

```
┌─────────────────────────────┐
│  🏷️ 1 boutique             │
│  Starter                    │
│                             │
│  23€                        │  ← EUR (blanc, grande taille)
│  15 000 FCFA                │  ← FCFA (amber, taille moyenne)
│  par mois                   │
│                             │
│  ✓ 1 point de vente        │
│  ✓ 3 utilisateurs max      │
│  ✓ Support standard        │
│                             │
│  [Commencer →]              │
└─────────────────────────────┘
```

## 🔄 Gestion dynamique

### Avantages de la solution :
1. **Un seul endroit à mettre à jour** - Modifier les plans dans l'admin plateforme met automatiquement à jour la landing page
2. **Prix cohérents** - Pas de risque de désynchronisation entre landing et système
3. **Facilité de maintenance** - Plus besoin de modifier le code pour changer les prix
4. **Multi-langue supporté** - Le système adapte l'affichage selon la langue (FR/EN)

### Calculs automatiques :
- Conversion EUR ↔ FCFA automatique
- Formatage des nombres selon les standards français
- Gestion des plans illimités
- Mise en avant du plan central (highlighted)

## 📊 Données exposées à la landing page

Chaque plan expose :
- **Informations de base** : nom, slug, description
- **Prix** : montant brut + versions formatées (EUR + FCFA)
- **Limites** : max_shops, max_users
- **Features** : tableau de fonctionnalités
- **Textes générés** : shop_limit_text
- **Flags booléens** : has_unlimited_shops, has_unlimited_users

## 🚀 Processus de mise à jour

Pour modifier les prix ou plans affichés sur la landing page :

1. **Se connecter en tant qu'admin_platforme**
2. **Accéder à :** Dashboard → Plans d'abonnement
3. **Modifier le plan** souhaité
4. **Sauvegarder**
5. ✅ **La landing page est automatiquement mise à jour**

## 🔧 Personnalisation par langue

Le système adapte automatiquement :
- **Badge** : "1 boutique" (FR) vs "1 store" (EN)
- **Subtitle** : "par mois" (FR) vs "per month" (EN)
- **Features** : Les fonctionnalités sont stockées telles quelles dans la DB

## 💡 Notes techniques

### Taux de change :
Le taux EUR/FCFA (655.957) est codé en dur car c'est un **taux fixe** établi par accord monétaire (zone CFA). Si besoin de le rendre configurable, il faudrait l'ajouter dans les settings de l'application.

### Formatage :
- `number_format($this->price, 0, ',', ' ')` = pas de décimales, virgule pour séparateur décimal, espace pour milliers
- Le formatage suit les standards français/CFA

### Performance :
- Les plans sont récupérés une seule fois au chargement de la page
- Pas de requêtes N+1
- Cache navigateur pour les assets

## ✅ Tests recommandés

- [ ] Vérifier l'affichage sur mobile/tablet/desktop
- [ ] Tester le changement de langue FR/EN
- [ ] Modifier un plan dans l'admin et vérifier la mise à jour
- [ ] Vérifier que les plans inactifs n'apparaissent pas
- [ ] Tester avec 1, 2, 3 ou plus de plans actifs

## 📝 Évolutions possibles

1. **Cache Redis** - Mettre les plans en cache pour améliorer les performances
2. **Prévisualisation** - Permettre de prévisualiser la landing avant activation d'un plan
3. **A/B Testing** - Tester différentes présentations de prix
4. **Animations** - Ajouter des animations au survol des cartes de prix
5. **Call-to-Action dynamiques** - Personnaliser les boutons selon le plan
6. **Promotions** - Afficher des badges "PROMO" ou "POPULAIRE"
