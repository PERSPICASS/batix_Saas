# 🔧 Correction: Switcher de Boutiques - Persistance de Sélection

## Date: 24 février 2026

## 🐛 Problème Identifié

### Symptôme
Lorsque l'utilisateur sélectionnait une boutique dans le **switcher** et ensuite cliquait sur un menu de navigation, **la boutique sélectionnée changeait** ou revenait à la boutique par défaut.

### Cause Racine

**Comportement incorrect** :
```
1. User sur /products (boutique A active par défaut)
2. User clique "Boutique B" dans switcher
   → URL devient: /products?shop=2
   → Session mise à jour: active_shop_id = 2
   → Affichage correct: "Boutique B" ✅

3. User clique sur menu "Ventes"
   → URL devient: /sales (SANS ?shop=2)
   → Frontend lit l'URL pour déterminer la boutique active
   → Aucun paramètre ?shop trouvé
   → Frontend affiche: "Boutique A" (première boutique) ❌
   → Mais session a toujours: active_shop_id = 2 ✅
```

**Le problème** : Le frontend lisait la boutique active depuis l'**URL** (`?shop=X`) au lieu de la lire depuis la **session** (via props Inertia).

---

## ✅ Solution Appliquée

### Changement Principal

**Avant** : Lire `activeShop` depuis l'URL
```tsx
const [currentPath, queryString = ''] = page.url.split('?');
const query = new URLSearchParams(queryString);
const activeShopId = query.get('shop') ?? (shops.length > 0 ? shops[0].id : '');
const activeShop = shops.find((shop) => shop.id === activeShopId) ?? shops[0];
```

**Après** : Lire `activeShop` depuis les props Inertia (session)
```tsx
const activeShopFromProps = page.props.activeShop as { id: number; name: string; slug: string } | null;

const activeShop = activeShopFromProps 
    ? { id: activeShopFromProps.id.toString(), name: activeShopFromProps.name, slug: activeShopFromProps.slug }
    : (shops.length > 0 ? shops[0] : null);
```

### Fonction de Changement de Boutique

```tsx
const handleShopChange = (shopId: string) => {
    const [currentPath] = page.url.split('?');
    router.visit(`${currentPath}?shop=${shopId}`, {
        preserveState: false, // Recharger pour mettre à jour toutes les données
        preserveScroll: true,
    });
    setShopMenuOpen(false);
};
```

### Switcher Mis à Jour

**Avant** : Utiliser `<Link>` avec href
```tsx
<Link
    key={shop.id}
    href={`${currentPath}?shop=${shop.id}`}
    onClick={() => setShopMenuOpen(false)}
>
    {shop.name}
</Link>
```

**Après** : Utiliser `<button>` avec fonction
```tsx
<button
    key={shop.id}
    type="button"
    onClick={() => handleShopChange(shop.id)}
    className="w-full text-left..."
>
    {shop.name}
</button>
```

---

## 🔄 Nouveau Flux Fonctionnel

### Scénario Corrigé

```
1. User sur /products
   └─> Frontend lit: page.props.activeShop (session)
   └─> Affiche: "Boutique A" ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. User clique "Boutique B" dans switcher
   └─> handleShopChange('2') appelée
   └─> router.visit('/products?shop=2')
   └─> Backend: Middleware intercepte ?shop=2
   └─> Backend: session['active_shop_id'] = 2
   └─> Backend: page.props.activeShop = Boutique B
   └─> Frontend reçoit: activeShop = Boutique B
   └─> Affiche: "Boutique B" ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. User clique sur menu "Ventes"
   └─> Navigation vers: /sales (pas de ?shop)
   └─> Backend: session['active_shop_id'] = 2 (persiste)
   └─> Backend: page.props.activeShop = Boutique B
   └─> Frontend lit: page.props.activeShop
   └─> Affiche: "Boutique B" ✅ ✅ ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. User navigue vers n'importe quelle page
   └─> session['active_shop_id'] = 2 (persiste)
   └─> Toutes les pages affichent: "Boutique B" ✅
```

---

## 📁 Fichiers Modifiés

### 1. `resources/js/Layouts/AuthenticatedLayout.tsx`

**Changements** :
1. ✅ Import de `router` depuis `@inertiajs/react`
2. ✅ Lecture de `activeShop` depuis `page.props.activeShop`
3. ✅ Fonction `handleShopChange()` pour changer de boutique
4. ✅ Switcher utilise `<button>` au lieu de `<Link>`
5. ✅ Suppression de la lecture depuis l'URL

---

## 🎯 Résultat

### Avant ❌
```
User change boutique → Switcher affiche correctement
User navigue → Boutique revient à la première
User confus → Doit re-sélectionner à chaque page
```

### Après ✅
```
User change boutique → Switcher affiche correctement
User navigue → Boutique reste celle sélectionnée
User satisfait → Navigation fluide et prévisible
```

---

## 🔍 Explication Technique

### Source de Vérité

**Avant** : URL (`?shop=X`)
- ❌ Perdue lors de navigation
- ❌ Fragile
- ❌ Paramètre requis dans tous les liens

**Après** : Session (via `page.props.activeShop`)
- ✅ Persiste automatiquement
- ✅ Robuste
- ✅ Pas besoin de paramètre dans les liens

### Architecture

```
Session (Backend)
    ↓
Inertia Props (page.props.activeShop)
    ↓
Frontend State
    ↓
UI Display
```

**Avantages** :
- ✅ Une seule source de vérité
- ✅ Synchronisation automatique
- ✅ Pas de désynchronisation URL/Session

---

## 🧪 Tests de Validation

### Test 1: Changement de Boutique ✅
```
1. Sélectionner "Boutique B"
2. Vérifier affichage switcher = "Boutique B"
3. Vérifier données affichées = Boutique B
→ PASS ✅
```

### Test 2: Navigation Entre Pages ✅
```
1. Sélectionner "Boutique B"
2. Cliquer "Produits" → Affiche Boutique B
3. Cliquer "Ventes" → Affiche Boutique B
4. Cliquer "Stock" → Affiche Boutique B
→ PASS ✅
```

### Test 3: Rafraîchissement Page ✅
```
1. Sélectionner "Boutique B"
2. Rafraîchir page (F5)
3. Vérifier boutique = "Boutique B"
→ PASS ✅
```

### Test 4: Ouverture Nouvel Onglet ✅
```
1. Sélectionner "Boutique B"
2. Cmd+Clic sur "Ventes" (nouvel onglet)
3. Nouvel onglet affiche = "Boutique B"
→ PASS ✅ (session partagée)
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Source boutique active** | URL `?shop=X` | Session + Props |
| **Persistance navigation** | ❌ Non | ✅ Oui |
| **Rafraîchissement** | ⚠️ Perd sélection | ✅ Préserve |
| **Liens navigation** | ⚠️ Besoin ?shop | ✅ Aucun param requis |
| **Synchronisation** | ❌ Désynchronisé | ✅ Toujours sync |
| **Expérience utilisateur** | ⚠️ Frustrante | ✅ Fluide |

---

## 💡 Points Clés

### Ce qui a changé
1. **Frontend lit depuis props** au lieu de l'URL
2. **Switcher utilise router.visit()** pour mise à jour complète
3. **Session = source de vérité** unique

### Ce qui n'a PAS changé
- ✅ Middleware `SetActiveShop` (intact)
- ✅ Helpers `get_active_shop_id()` (intacts)
- ✅ Contrôleurs (aucun changement)
- ✅ Backend logic (inchangée)

### Pourquoi ça fonctionne maintenant
```
Middleware stocke en session
    ↓
AppServiceProvider partage activeShop
    ↓
Frontend lit page.props.activeShop
    ↓
Affichage cohérent partout
```

---

## 🚀 Impact

### Performance
- ✅ **Aucun impact négatif**
- ✅ Même nombre de requêtes
- ✅ Pas de polling ou websockets nécessaires

### Maintenabilité
- ✅ **Code plus simple**
- ✅ Une seule source de vérité
- ✅ Moins de logique conditionnelle

### Évolutivité
- ✅ **Facile à étendre**
- ✅ Pas de refactoring majeur requis
- ✅ Pattern réutilisable

---

## 📝 Lessons Learned

### Erreur Initiale
Essayer de lire l'état depuis l'URL alors que la session est la vraie source de vérité.

### Solution
Toujours privilégier la **session** (via props partagées) pour l'état applicatif qui doit persister.

### Best Practice
```tsx
// ❌ Mauvais - Lire depuis URL
const activeShop = getShopFromUrl();

// ✅ Bon - Lire depuis props (session)
const activeShop = page.props.activeShop;
```

---

## ✅ Checklist de Validation

- [x] Frontend lit `activeShop` depuis props
- [x] Switcher utilise `handleShopChange()`
- [x] Navigation préserve sélection
- [x] Rafraîchissement préserve sélection
- [x] Aucune régression sur fonctionnalités existantes
- [x] Build réussi sans erreurs
- [x] Tests manuels passés

---

**Date de correction** : 24 février 2026  
**Type** : Bug Fix - Persistance de sélection  
**Priorité** : HAUTE - Impact UX majeur  
**Statut** : ✅ **CORRIGÉ ET VALIDÉ**  
**Impact** : La sélection de boutique persiste maintenant correctement dans toute l'application
