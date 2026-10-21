# Intégration UI : Bannière de Restrictions d'Abonnement

## ✅ Mise en œuvre complète

L'interface utilisateur affiche maintenant **en temps réel** les limites d'abonnement et désactive automatiquement les boutons de création lorsque les limites sont atteintes.

## 🎨 Pages modifiées

### 1. **Page des Boutiques** (`resources/js/Pages/Shops/Index.tsx`)

#### Changements apportés

✅ **Import du composant** :
```tsx
import SubscriptionBanner, { useSubscriptionLimits } from '@/Components/SubscriptionBanner';
```

✅ **Hook d'utilisation** :
```tsx
const subscription = useSubscriptionLimits();
```

✅ **Bannière affichée** :
```tsx
{subscription && <SubscriptionBanner type="shops" />}
```

✅ **Bouton "Nouvelle boutique" dynamique** :
```tsx
<Link
    href={route('shops.create')}
    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
        subscription?.can_create_shop
            ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
    }`}
    onClick={(e) => {
        if (!subscription?.can_create_shop) {
            e.preventDefault();
        }
    }}
>
    <Plus className="size-4" /> Nouvelle boutique
</Link>
```

#### Comportement

- **Bannière visible** : Affiche en haut de la page les limites de boutiques
- **Bouton actif** (vert/ambre) : Création autorisée, limite non atteinte
- **Bouton désactivé** (gris) : Limite atteinte, clic bloqué, curseur "not-allowed"
- **État vide** : Le bouton "Créer ma première boutique" est également désactivé si limite atteinte

### 2. **Page des Utilisateurs** (`resources/js/Pages/Users/Index.tsx`)

#### Changements apportés

✅ **Import du composant** :
```tsx
import SubscriptionBanner, { useSubscriptionLimits } from '@/Components/SubscriptionBanner';
```

✅ **Hook d'utilisation** :
```tsx
const subscription = useSubscriptionLimits();
```

✅ **Bannière affichée** :
```tsx
{subscription && <SubscriptionBanner type="users" />}
```

✅ **Bouton "Nouvel utilisateur" dynamique** :
```tsx
<Link
    href={route('users.create')}
    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
        subscription?.can_create_user
            ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
    }`}
    onClick={(e) => {
        if (!subscription?.can_create_user) {
            e.preventDefault();
        }
    }}
>
    <Plus className="size-4" /> Nouvel utilisateur
</Link>
```

#### Comportement

- **Bannière visible** : Affiche en haut de la page les limites d'utilisateurs
- **Bouton actif** (vert/ambre) : Création autorisée, slots disponibles
- **Bouton désactivé** (gris) : Limite atteinte, navigation bloquée
- **Affichage tableau** : Le tableau reste visible même si limite atteinte

## 🎯 Expérience utilisateur

### Workflow complet

```
1. User ouvre la page Boutiques/Utilisateurs
   ↓
2. Bannière affichée en haut (si super_admin avec abonnement)
   ├─ 🟢 Vert : Capacité disponible
   ├─ 🟡 Jaune : Proche de la limite
   └─ 🔴 Rouge : Limite atteinte
   ↓
3. Bouton "Créer" s'adapte automatiquement
   ├─ ✅ Actif : Navigation autorisée
   └─ ❌ Désactivé : Clic bloqué avec message
   ↓
4. Si tentative de création malgré tout
   └─ Middleware serveur bloque et redirige avec erreur
```

### Exemple visuel : Plan Starter (1 boutique, 3 utilisateurs)

#### État initial (0 boutique, 1 utilisateur)

```
┌─────────────────────────────────────────────┐
│ 📊 Plan Starter                    [Actif]  │
│                                             │
│ ✓ 0 / 1 boutiques utilisées (1 restante)   │
│ ✓ 1 / 3 utilisateurs (2 restants)          │
└─────────────────────────────────────────────┘

[🟢 Nouvelle boutique]  [🟢 Nouvel utilisateur]
```

#### État à 80% (1 boutique, 2 utilisateurs)

```
┌─────────────────────────────────────────────┐
│ 📊 Plan Starter                    [Actif]  │
│                                             │
│ ⚠️  1 / 1 boutiques utilisées               │
│ ⚠️  2 / 3 utilisateurs (1 restant)          │
└─────────────────────────────────────────────┘

[⚪ Nouvelle boutique]  [🟡 Nouvel utilisateur]
    (désactivé)            (limite proche)
```

#### État limite atteinte (1 boutique, 3 utilisateurs)

```
┌─────────────────────────────────────────────┐
│ 📊 Plan Starter                    [Actif]  │
│                                             │
│ ❌ 1 / 1 boutiques utilisées                │
│    Limite atteinte. Mettez à niveau.       │
│                                             │
│ ❌ 3 / 3 utilisateurs                       │
│    Limite atteinte. Mettez à niveau.       │
└─────────────────────────────────────────────┘

[⚪ Nouvelle boutique]  [⚪ Nouvel utilisateur]
    (désactivé)            (désactivé)
```

## 🔧 Code technique

### Hook personnalisé `useSubscriptionLimits()`

```tsx
import { useSubscriptionLimits } from '@/Components/SubscriptionBanner';

function MyComponent() {
    const subscription = useSubscriptionLimits();
    
    // Données disponibles :
    subscription?.plan_name          // "Starter"
    subscription?.status             // "active" | "trial" | ...
    subscription?.max_shops          // 1 ou -1 (illimité)
    subscription?.max_users          // 3 ou -1
    subscription?.current_shops      // 0
    subscription?.current_users      // 1
    subscription?.remaining_shops    // 1 ou -1
    subscription?.remaining_users    // 2 ou -1
    subscription?.can_create_shop    // true
    subscription?.can_create_user    // true
    subscription?.expires_at         // "2026-03-27"
}
```

### Classes CSS conditionnelles

#### Bouton activé (limite OK)
```tsx
bg-amber-300 text-slate-950 hover:bg-amber-200
```
- Fond jaune-or
- Texte noir
- Survol plus clair
- Curseur pointer (défaut)

#### Bouton désactivé (limite atteinte)
```tsx
bg-slate-700 text-slate-400 cursor-not-allowed opacity-60
```
- Fond gris foncé
- Texte gris clair
- Curseur "not-allowed" (🚫)
- Opacité réduite (60%)

### Prévention du clic

```tsx
onClick={(e) => {
    if (!subscription?.can_create_shop) {
        e.preventDefault();
    }
}}
```

Empêche la navigation même si l'utilisateur modifie le CSS avec les DevTools.

## 🛡️ Sécurité multi-couches

### Niveau 1 : UI (expérience utilisateur)
- Bouton grisé visuellement
- Message d'avertissement dans bannière
- Prévention du clic JavaScript

### Niveau 2 : Navigation (sécurité frontend)
- `e.preventDefault()` bloque la navigation
- Validation côté client

### Niveau 3 : Middleware (sécurité backend)
- `CheckSubscriptionLimits` valide côté serveur
- **Impossible à contourner** même en modifiant le frontend
- Redirection avec message d'erreur

### Niveau 4 : Contrôleur (validation métier)
```php
// Recommandé dans le contrôleur store()
if (!auth()->user()->canCreateShop()) {
    return back()->with('error', 'Limite de boutiques atteinte.');
}
```

## 📱 Responsive

Le composant `SubscriptionBanner` est **entièrement responsive** :

- **Mobile** : Informations empilées verticalement
- **Tablet** : Affichage compact avec icônes
- **Desktop** : Layout horizontal avec toutes les infos

Les boutons s'adaptent également :
- Mobile : Taille réduite, icône seule possible
- Desktop : Icône + texte

## 🎨 Design System

### Couleurs de statut

#### 🟢 Vert (Emerald) - OK
```css
bg-emerald-500/20 text-emerald-400
border-emerald-300/30
```
Usage : Capacité disponible, tout va bien

#### 🟡 Jaune (Amber) - Attention
```css
bg-amber-500/20 text-amber-400
border-amber-300/30
```
Usage : Proche de la limite (1-2 slots restants)

#### 🔴 Rouge (Rose) - Erreur
```css
bg-rose-500/20 text-rose-400
border-rose-300/30
```
Usage : Limite atteinte, action bloquée

### Typographie

- **Titre** : `text-sm font-semibold text-white`
- **Badge statut** : `text-xs font-medium uppercase`
- **Compteurs** : `text-sm text-slate-300`
- **Avertissements** : `text-xs text-rose-400`

## 🧪 Tests recommandés

### Test 1 : Affichage initial
```
✅ Ouvrir page boutiques
✅ Bannière visible avec limites
✅ Bouton "Nouvelle boutique" actif (vert)
✅ Compteur affiche "0 / X boutiques"
```

### Test 2 : Approche de la limite
```
✅ Créer boutiques jusqu'à N-1
✅ Bannière devient jaune/amber
✅ Message "X restante(s)" visible
✅ Bouton reste actif
```

### Test 3 : Limite atteinte
```
✅ Créer la dernière boutique autorisée
✅ Bannière devient rouge
✅ Message "Limite atteinte" visible
✅ Bouton devient gris et désactivé
✅ Clic sur bouton ne fait rien
✅ Tentative d'accès direct à /boutiques/create bloquée
```

### Test 4 : Plans illimités
```
✅ Account avec plan Scale (-1 = illimité)
✅ Bannière affiche "Boutiques illimitées"
✅ Aucune limite, couleur verte
✅ Bouton toujours actif
```

### Test 5 : Sans abonnement
```
✅ Account sans subscription active
✅ Bannière affiche message d'erreur
✅ Tous les boutons désactivés
✅ Message "Aucun abonnement actif"
```

### Test 6 : Roles différents
```
✅ Admin_platforme : Pas de bannière (bypass)
✅ Manager/Cashier : Pas de bannière (pas super_admin)
✅ Super_admin : Bannière visible
```

## 🔄 Synchronisation temps réel

Les données de la bannière sont **automatiquement mises à jour** :

1. Création d'une boutique → Compteur incrémenté
2. Suppression d'une boutique → Compteur décrémenté
3. Mise à niveau du plan → Limites ajustées
4. Expiration d'abonnement → Statut changé

Grâce au middleware `HandleInertiaRequests`, les données sont **toujours fraîches** à chaque requête Inertia.

## 📊 Analytics possibles

Avec ce système, vous pouvez tracker :

```php
// Events à logger
- Tentative de création avec limite atteinte
- Nombre de fois qu'un utilisateur voit le message "Limite atteinte"
- Conversion vers upgrade après avoir vu la bannière
- Taux d'utilisation par plan (X% utilisent Y/Z boutiques)
```

Ces métriques aident à :
- Optimiser les limites de chaque plan
- Identifier les utilisateurs à risque de churn
- Proposer des upgrades au bon moment
- Améliorer la tarification

## 🚀 Améliorations futures

### Court terme
- [ ] Tooltip sur bouton désactivé expliquant pourquoi
- [ ] Animation lors du changement de statut (vert → jaune → rouge)
- [ ] Notification toast quand limite approchée

### Moyen terme
- [ ] Graphique de progression dans la bannière
- [ ] Bouton "Mettre à niveau" directement dans la bannière
- [ ] Comparaison des plans en modal

### Long terme
- [ ] Prédiction du moment où la limite sera atteinte
- [ ] Recommandation de plan basée sur l'utilisation
- [ ] A/B testing sur le design de la bannière

## 📚 Ressources

- **Composant principal** : `resources/js/Components/SubscriptionBanner.tsx`
- **Hook** : `useSubscriptionLimits()` exporté par le composant
- **Middleware** : `app/Http/Middleware/CheckSubscriptionLimits.php`
- **Model** : `app/Models/User.php` (méthodes canCreate*)
- **Documentation technique** : `docs/SUBSCRIPTION_RESTRICTIONS.md`
- **Résumé** : `docs/SUBSCRIPTION_RESTRICTIONS_RESUME.md`

## ✅ Checklist finale

- [x] Composant SubscriptionBanner créé
- [x] Hook useSubscriptionLimits() implémenté
- [x] Intégré dans page Boutiques
- [x] Intégré dans page Utilisateurs
- [x] Boutons désactivés selon limites
- [x] Classes CSS conditionnelles
- [x] Prévention du clic JavaScript
- [x] Compilation TypeScript réussie
- [x] Documentation complète
- [ ] Tests manuels à effectuer
- [ ] Tests automatisés à écrire
- [ ] Validation UX par utilisateurs réels

---

**Status** : ✅ **Implémentation UI complète et fonctionnelle**

**Prochaine étape** : Tests manuels en créant des boutiques/utilisateurs jusqu'aux limites pour valider le comportement complet du système.
