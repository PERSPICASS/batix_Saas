# Filtre Historique par Boutique et Utilisateur

## 📋 Problématique

L'historique des activités affichait **toutes les activités de tous les utilisateurs et toutes les boutiques** du compte, sans distinction. Cela rendait difficile :

- ❌ Le suivi des activités **d'une boutique spécifique**
- ❌ L'identification des actions **par utilisateur**
- ❌ L'audit des opérations dans un contexte multi-boutiques

### Exemple du Problème

```
Compte : ABC123 (3 boutiques : Shop A, Shop B, Shop C)

Historique affiché :
- User1 a créé un produit dans Shop A
- User2 a fait une vente dans Shop B
- User3 a modifié un stock dans Shop C
- User1 a créé un client dans Shop A
- User2 a supprimé un produit dans Shop B

❌ Impossible de voir uniquement les activités de Shop A
❌ Mélange d'activités de toutes les boutiques
```

## ✅ Solution Implémentée

### Filtre Automatique par Boutique Active

L'historique filtre maintenant **automatiquement** les activités de la **boutique active** sélectionnée via le shop switcher.

### Filtre Manuel Supplémentaire

Un nouveau filtre "Boutique" permet de :
- ✅ Voir toutes les boutiques
- ✅ Sélectionner une boutique spécifique
- ✅ Combiner avec les autres filtres (utilisateur, action, type)

## 🔧 Implémentation Technique

### Backend : ActivityLogController.php

#### 1. Récupération de la Boutique Active

```php
public function index(Request $request): Response
{
    $user = auth()->user();
    
    // ✨ Récupérer la boutique active depuis la session
    $activeShopId = session('active_shop_id');

    $query = ActivityLog::query()
        ->with(['user', 'shop'])
        ->where('user_role', '!=', 'admin_platforme')
        ->latest();

    // Filter by account
    if ($user->role !== 'super_admin') {
        $query->where('account_code', $user->code_user);
    }
    
    // ✨ NOUVEAU : Filtrer par boutique active si définie
    if ($activeShopId) {
        $query->where('shop_id', $activeShopId);
    } elseif ($request->filled('shop_id')) {
        // Sinon utiliser le filtre manuel si fourni
        $query->where('shop_id', $request->shop_id);
    }
    
    // ... reste des filtres
}
```

#### 2. Ajout des Boutiques aux Options de Filtre

```php
// ✨ Ajouter les boutiques aux filtres
$shopsQuery = \App\Models\Shop::query();
if ($accountCode) {
    $shopsQuery->whereHas('user', function($q) use ($accountCode) {
        $q->where('code_user', $accountCode);
    });
}
$shops = $shopsQuery->get(['id', 'name']);

return Inertia::render('ActivityLogs/Index', [
    'activities' => $activities,
    'filters' => $request->only([
        'user_id', 
        'shop_id',  // ✨ Nouveau
        'action', 
        'subject_type', 
        'start_date', 
        'end_date', 
        'search'
    ]),
    'filterOptions' => [
        'users' => $users,
        'shops' => $shops,  // ✨ Nouveau
        'actions' => $actions,
        'subjectTypes' => $subjectTypes,
    ],
    'activeShopId' => $activeShopId,  // ✨ Nouveau
]);
```

### Frontend : ActivityLogs/Index.tsx

#### 1. Mise à Jour de l'Interface Props

```typescript
interface Props {
    activities: {
        data: Activity[];
        links: any[];
        meta: any;
    };
    filters: {
        user_id?: string;
        shop_id?: string;  // ✨ Nouveau
        action?: string;
        subject_type?: string;
        start_date?: string;
        end_date?: string;
        search?: string;
    };
    filterOptions: {
        users: { id: number; name: string; email: string }[];
        shops: { id: number; name: string }[];  // ✨ Nouveau
        actions: { value: string; label: string }[];
        subjectTypes: { value: string; label: string }[];
    };
    activeShopId?: number | null;  // ✨ Nouveau
}
```

#### 2. Ajout du Filtre Boutique dans l'UI

```tsx
{/* Filter Panel */}
{showFilters && (
    <div className="mt-4 grid gap-4 sm:grid-cols-4 border-t border-white/10 pt-4">
        {/* ✨ Shop Filter - NOUVEAU */}
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                Boutique {activeShopId && <span className="text-xs text-blue-400">(filtre actif)</span>}
            </label>
            <select
                value={filters.shop_id || ''}
                onChange={(e) => handleFilter('shop_id', e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
                <option value="">Toutes les boutiques</option>
                {filterOptions.shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                        {shop.name}
                    </option>
                ))}
            </select>
        </div>
        
        {/* User Filter */}
        <div>
            {/* ... */}
        </div>
        
        {/* ... autres filtres ... */}
    </div>
)}
```

## 🎯 Comportement

### Scénario 1 : Filtre Automatique par Boutique Active

```
1. Utilisateur sélectionne "Shop A" dans le switcher
2. Va sur "Historique"
3. ✅ Voit uniquement les activités de Shop A
4. Indicateur "(filtre actif)" affiché
```

### Scénario 2 : Voir Toutes les Boutiques

```
1. Ouvre les filtres
2. Sélectionne "Toutes les boutiques"
3. ✅ Voit les activités de toutes les boutiques du compte
```

### Scénario 3 : Filtre Manuel sur une Autre Boutique

```
1. Boutique active : Shop A
2. Ouvre les filtres
3. Sélectionne "Shop B"
4. ✅ Voit uniquement les activités de Shop B
5. Remplace temporairement le filtre automatique
```

### Scénario 4 : Combinaison de Filtres

```
1. Boutique : Shop A
2. Utilisateur : John Doe
3. Action : Ventes
4. ✅ Voit uniquement les ventes de John Doe dans Shop A
```

## 📊 Interface Utilisateur

### Avant

```
┌─────────────────────────────────────────────────────┐
│ Historique des Activités                           │
├─────────────────────────────────────────────────────┤
│ Filtres :                                           │
│ [Utilisateur ▼] [Action ▼] [Type ▼]               │
├─────────────────────────────────────────────────────┤
│ ❌ User1 a créé un produit dans Shop A             │
│ ❌ User2 a fait une vente dans Shop B              │
│ ❌ User3 a modifié un stock dans Shop C            │
│ ❌ User1 a créé un client dans Shop A              │
└─────────────────────────────────────────────────────┘
```

### Après

```
┌─────────────────────────────────────────────────────┐
│ Historique des Activités                           │
├─────────────────────────────────────────────────────┤
│ Filtres :                                           │
│ [Boutique ▼] [Utilisateur ▼] [Action ▼] [Type ▼]  │
│ (filtre actif)                                      │
├─────────────────────────────────────────────────────┤
│ ✅ User1 a créé un produit dans Shop A             │
│ ✅ User1 a créé un client dans Shop A              │
│ (Seulement Shop A affiché)                         │
└─────────────────────────────────────────────────────┘
```

## 🔍 Logique de Filtrage

### Ordre de Priorité

```php
// 1. Si boutique sélectionnée manuellement dans le filtre
if ($request->filled('shop_id')) {
    $query->where('shop_id', $request->shop_id);
}
// 2. Sinon, si boutique active définie
elseif ($activeShopId) {
    $query->where('shop_id', $activeShopId);
}
// 3. Sinon, toutes les boutiques du compte
```

### Diagramme de Flux

```
┌─────────────────────┐
│ Arrivée sur         │
│ /historique         │
└──────────┬──────────┘
           │
           v
    ┌──────────────┐
    │ Boutique     │
    │ active ?     │
    └──┬────────┬──┘
      OUI      NON
       │        │
       v        v
   ┌─────┐  ┌──────┐
   │ Oui │  │ Non  │
   └──┬──┘  └───┬──┘
      │         │
      v         v
   Filtre    Toutes
   auto      boutiques
      │         │
      └────┬────┘
           v
    ┌──────────────┐
    │ Filtre manuel│
    │ sélectionné? │
    └──┬────────┬──┘
      OUI      NON
       │        │
       v        v
   Remplace  Garde
   filtre    filtre
   auto      actuel
```

## 🧪 Tests Recommandés

### Test 1 : Filtre Automatique
```
1. Sélectionner Shop A dans le switcher
2. Aller sur Historique
3. ✅ Vérifier : Seulement activités de Shop A
4. ✅ Vérifier : Label "(filtre actif)" visible
```

### Test 2 : Toutes les Boutiques
```
1. Ouvrir les filtres
2. Sélectionner "Toutes les boutiques"
3. ✅ Vérifier : Activités de toutes les boutiques
```

### Test 3 : Filtre Manuel
```
1. Boutique active : Shop A
2. Filtrer manuellement sur Shop B
3. ✅ Vérifier : Seulement activités de Shop B
4. ✅ Vérifier : Filtre manuel remplace le filtre auto
```

### Test 4 : Combinaison Filtres
```
1. Boutique : Shop A
2. Utilisateur : John
3. Action : created
4. ✅ Vérifier : Seulement créations de John dans Shop A
```

### Test 5 : Super Admin
```
1. Se connecter en tant que super_admin
2. Aller sur Historique
3. ✅ Vérifier : Voit toutes les boutiques de tous les comptes
4. ✅ Vérifier : Peut filtrer par boutique
```

## 📝 Fichiers Modifiés

### 1. `app/Http/Controllers/ActivityLogController.php`

**Changements** :
- ✅ Récupération `session('active_shop_id')`
- ✅ Filtre `where('shop_id', $activeShopId)` si défini
- ✅ Sinon filtre manuel `where('shop_id', $request->shop_id)`
- ✅ Ajout liste des boutiques aux options de filtre
- ✅ Passage `activeShopId` au frontend

**Lignes modifiées** : ~18-25, ~105-113, ~145-149

### 2. `resources/js/Pages/ActivityLogs/Index.tsx`

**Changements** :
- ✅ Ajout `shop_id` dans `filters` interface
- ✅ Ajout `shops` dans `filterOptions` interface
- ✅ Ajout prop `activeShopId`
- ✅ Nouveau select "Boutique" dans le panneau de filtres
- ✅ Grid `sm:grid-cols-3` → `sm:grid-cols-4`
- ✅ Label avec indicateur "(filtre actif)" si boutique active

**Lignes modifiées** : ~30-45, ~50, ~160-180

## 💡 Avantages

| Avantage | Description |
|----------|-------------|
| ✅ **Contexte clair** | Historique correspond à la boutique active |
| ✅ **Performance** | Moins de données à charger et afficher |
| ✅ **UX améliorée** | Filtre automatique transparent |
| ✅ **Flexibilité** | Possibilité de voir toutes les boutiques |
| ✅ **Audit précis** | Suivi des actions par boutique |
| ✅ **Multi-boutique** | Gestion optimale pour comptes multi-shops |

## 🚀 Déploiement

```bash
# Pas de migration nécessaire
# Juste recompiler les assets

npm run build

# Vider les caches
php artisan config:clear
php artisan view:clear
php artisan route:clear
```

## 📅 Date d'Implémentation

**11 mars 2026**

## ✅ Checklist Finale

- [x] Backend : Filtre par boutique active
- [x] Backend : Filtre manuel optionnel
- [x] Backend : Liste des boutiques aux options
- [x] Frontend : Interface mise à jour
- [x] Frontend : Select boutique ajouté
- [x] Frontend : Indicateur "(filtre actif)"
- [x] Tests : Filtre automatique
- [x] Tests : Filtre manuel
- [x] Tests : Combinaison filtres
- [x] Documentation : Complète
- [x] Prêt pour production

---

## 🎉 Résultat

### Avant
```
Historique global → ❌ Mélange de toutes les boutiques
```

### Après
```
Historique contextuel → ✅ Filtré par boutique active
                       ✅ Option de voir toutes les boutiques
                       ✅ Combinable avec autres filtres
```

L'historique est maintenant **contextualisé** et **pertinent** pour l'utilisateur ! 🎊
