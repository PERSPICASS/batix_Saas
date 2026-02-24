# 🔧 Correction: Champs Boutique dans les Formulaires

## Date: 24 février 2026

## 🐛 Problème Identifié

### Symptômes
1. **Boutique incorrecte** : Les formulaires de création n'utilisaient pas la boutique sélectionnée dans le switcher
2. **Champ modifiable** : Le champ boutique n'était pas grisé/désactivé
3. **Première boutique par défaut** : Les formulaires utilisaient toujours `shops[0]` au lieu de la boutique active

### Exemple du Problème
```
User sélectionne "Boutique B" dans le switcher
User clique "Nouveau Produit"
Formulaire affiche: "Boutique A" (première) ❌
Attendu: "Boutique B" (active) ✅
```

---

## ✅ Solution Appliquée

### 1. Utiliser la Boutique Active depuis les Props

**Avant** :
```tsx
const { data, setData, post } = useForm({
    shop_id: shops[0]?.id || '', // ❌ Toujours la première
});
```

**Après** :
```tsx
const { props } = usePage();
const activeShop = props.activeShop as { id: number; name: string } | null;

const { data, setData, post } = useForm({
    shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '', // ✅ Boutique active
});
```

### 2. Griser le Champ Boutique

Le champ boutique est **TOUJOURS désactivé** puisque la boutique est contrôlée par le switcher.

**Avant** (seulement si 1 boutique) :
```tsx
{shops.length > 1 ? (
    <select onChange={...}>...</select>  // Modifiable
) : (
    <select disabled>...</select>  // Grisé seulement si 1 boutique
)}
```

**Après** (toujours grisé) :
```tsx
<select
    value={data.shop_id}
    disabled  // ✅ Toujours grisé
    className="... bg-slate-800/50 text-slate-400 cursor-not-allowed"
>
    {shops.map((shop) => (
        <option key={shop.id} value={shop.id}>
            {shop.name}
        </option>
    ))}
</select>
<p className="text-xs text-slate-400">
    Boutique sélectionnée via le switcher
</p>
```

---

## 📁 Fichiers Modifiés

### Formulaires CREATE

1. **`Products/Create.tsx`**
   - ✅ Import `usePage`
   - ✅ Lecture `activeShop` depuis props
   - ✅ Champ `shop_id` initialisé avec boutique active
   - ✅ Select toujours `disabled`

2. **`Categories/Create.tsx`**
   - ✅ Import `usePage`
   - ✅ Lecture `activeShop` depuis props
   - ✅ Champ `shop_id` initialisé avec boutique active
   - ✅ Select toujours `disabled`

3. **`Suppliers/Create.tsx`**
   - ✅ Import `usePage`
   - ✅ Lecture `activeShop` depuis props
   - ✅ Champ `shop_id` initialisé avec boutique active
   - ✅ Select toujours `disabled`

4. **`Customers/Create.tsx`**
   - ✅ Import `usePage`
   - ✅ Lecture `activeShop` depuis props
   - ✅ Champ `shop_id` initialisé avec boutique active
   - ✅ Select toujours `disabled`

5. **`Sales/Create.tsx`**
   - ✅ Import `usePage`
   - ✅ Lecture `activeShop` depuis props
   - ✅ Champ `shop_id` initialisé avec boutique active
   - ✅ Select toujours `disabled`

6. **`Stocks/Create.tsx`** (Nouveau)
   - ✅ Import `usePage`
   - ✅ Lecture `activeShop` depuis props
   - ✅ Champ `shop_id` initialisé avec boutique active
   - ✅ Select toujours `disabled`

7. **`Inventory/Create.tsx`** (Nouveau)
   - ✅ Import `usePage`
   - ✅ Lecture `activeShop` depuis props
   - ✅ Champ `shop_id` initialisé avec boutique active
   - ✅ Select toujours `disabled`

### Formulaires EDIT

Les formulaires d'édition avaient déjà le champ grisé (corrigé précédemment) :
- ✅ `Products/Edit.tsx`
- ✅ `Customers/Edit.tsx`
- ✅ `Suppliers/Edit.tsx`

---

## 🔄 Flux Complet

### Création d'une Ressource

```
1. User sélectionne "Boutique B" dans switcher
   └─> session['active_shop_id'] = 2
   └─> page.props.activeShop = { id: 2, name: "Boutique B" }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. User clique "Nouveau Produit"
   └─> ProductController@create
   └─> Inertia::render('Products/Create', [...])
   └─> AppServiceProvider partage activeShop
   └─> page.props.activeShop disponible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. Products/Create.tsx s'affiche
   └─> const activeShop = page.props.activeShop
   └─> useForm({ shop_id: activeShop?.id }) // 2
   └─> Select affiche "Boutique B" ✅
   └─> Select disabled (grisé) ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. User remplit le formulaire et soumet
   └─> POST /products avec shop_id = 2
   └─> Produit créé dans Boutique B ✅
```

---

## 🎯 Résultat

### Avant ❌
```
Boutique active: "Boutique B"
Formulaire affiche: "Boutique A" (première)
Champ: Modifiable
Création: Dans mauvaise boutique
```

### Après ✅
```
Boutique active: "Boutique B"
Formulaire affiche: "Boutique B" (active)
Champ: Grisé/Désactivé
Création: Dans boutique correcte
```

---

## 🔍 Détails Techniques

### Source de la Boutique Active

```tsx
// Props partagées globalement (AppServiceProvider)
'activeShop' => fn() => get_active_shop()

// Accessible dans tous les composants Inertia
const { props } = usePage();
const activeShop = props.activeShop;
```

### Hiérarchie de Sélection

```typescript
// 1. Boutique active (depuis switcher)
activeShop?.id.toString()

// 2. Première boutique (fallback)
|| shops[0]?.id.toString()

// 3. Chaîne vide (si aucune)
|| ''
```

### Style du Champ Désactivé

```tsx
className="
    w-full 
    rounded-lg 
    border border-white/10    // Bordure plus subtile
    bg-slate-800/50           // Fond grisé
    px-3 py-2 
    text-slate-400            // Texte gris
    cursor-not-allowed        // Curseur interdit
"
```

---

## 🧪 Tests de Validation

### Test 1: Boutique Active est Utilisée ✅
```
1. Sélectionner "Boutique B" dans switcher
2. Cliquer "Nouveau Produit"
3. Vérifier champ boutique = "Boutique B"
→ PASS ✅
```

### Test 2: Champ est Grisé ✅
```
1. Ouvrir n'importe quel formulaire CREATE
2. Vérifier que le select boutique est disabled
3. Essayer de changer la valeur (impossible)
→ PASS ✅
```

### Test 3: Changement de Boutique ✅
```
1. Boutique A active
2. Ouvrir "Nouveau Produit" → Affiche "Boutique A"
3. Annuler et sélectionner "Boutique B"
4. Ouvrir "Nouveau Produit" → Affiche "Boutique B"
→ PASS ✅
```

### Test 4: Création dans Bonne Boutique ✅
```
1. Sélectionner "Boutique B"
2. Créer un nouveau produit
3. Vérifier dans DB: product.shop_id = 2
→ PASS ✅
```

### Test 5: Formulaires Edit ✅
```
1. Modifier un produit existant
2. Vérifier champ boutique = grisé
3. Vérifier message "ne peut pas être modifiée"
→ PASS ✅
```

---

## 📊 Couverture

### Formulaires CREATE Corrigés

| Formulaire | activeShop | Champ Grisé | Status |
|-----------|------------|-------------|---------|
| Products/Create | ✅ | ✅ | ✅ Corrigé |
| Categories/Create | ✅ | ✅ | ✅ Corrigé |
| Suppliers/Create | ✅ | ✅ | ✅ Corrigé |
| Customers/Create | ✅ | ✅ | ✅ Corrigé |
| Sales/Create | ✅ | ✅ | ✅ Corrigé |
| Stocks/Create | ✅ | ✅ | ✅ Corrigé |
| Inventory/Create | ✅ | ✅ | ✅ Corrigé |

### Formulaires EDIT Vérifiés

| Formulaire | Champ Grisé | Message | Status |
|-----------|-------------|---------|---------|
| Products/Edit | ✅ | "ne peut pas être modifiée" | ✅ OK |
| Customers/Edit | ✅ | "ne peut pas être modifiée" | ✅ OK |
| Suppliers/Edit | ✅ | "via le switcher" | ✅ OK |

---

## 💡 Avantages

### UX Améliorée
- ✅ **Cohérence** : La boutique affichée correspond à celle sélectionnée
- ✅ **Clarté** : Champ grisé = ne peut pas être modifié
- ✅ **Guidage** : Message explique comment changer la boutique

### Prévention d'Erreurs
- ✅ **Pas de confusion** : Impossible de créer dans mauvaise boutique
- ✅ **Pas d'accident** : Impossible de modifier par erreur
- ✅ **Comportement prévisible** : Toujours la boutique du switcher

### Architecture Propre
- ✅ **Source unique** : `page.props.activeShop` partout
- ✅ **Pas de duplication** : Code uniforme dans tous les formulaires
- ✅ **Maintenable** : Changement global facile si besoin

---

## 🔗 Liens avec Autres Fixes

### Dépend de
- ✅ `SetActiveShop` Middleware (session management)
- ✅ `AppServiceProvider` (Inertia shared props)
- ✅ `SHOP_SWITCHER_FIX.md` (persistance de sélection)

### Impact sur
- ✅ Création de produits dans bonne boutique
- ✅ Création de catégories dans bonne boutique
- ✅ Toutes les ressources multi-tenant

---

## 📝 Pattern Réutilisable

Pour tout nouveau formulaire avec `shop_id` :

```tsx
import { useForm, usePage } from '@inertiajs/react';

export default function MyCreate({ shops }: Props) {
    // 1. Récupérer activeShop depuis props
    const { props } = usePage();
    const activeShop = props.activeShop as { id: number; name: string } | null;
    
    // 2. Initialiser avec activeShop
    const { data, setData, post } = useForm({
        shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || '',
        // ... autres champs
    });

    // 3. Afficher le select désactivé
    return (
        <select
            value={data.shop_id}
            disabled
            className="... bg-slate-800/50 text-slate-400 cursor-not-allowed"
        >
            {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                    {shop.name}
                </option>
            ))}
        </select>
        <p className="text-xs text-slate-400">
            Boutique sélectionnée via le switcher
        </p>
    );
}
```

---

## ✅ Checklist Finale

- [x] Tous les formulaires CREATE utilisent `activeShop`
- [x] Tous les champs boutique sont grisés
- [x] Messages informatifs ajoutés
- [x] Imports `usePage` ajoutés partout
- [x] Build réussi sans erreurs
- [x] Pattern documenté pour réutilisation

---

**Date de correction** : 24 février 2026  
**Type** : Bug Fix - Multi-tenancy UX  
**Priorité** : CRITIQUE - Empêchait création dans bonne boutique  
**Statut** : ✅ **CORRIGÉ ET VALIDÉ**  
**Impact** : Toutes les ressources sont maintenant créées dans la boutique correcte
