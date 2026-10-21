# 🔄 Correction: Switcher de Boutiques - Contexte Global

## Date: 24 février 2026

## 🎯 Problème Identifié

### Symptôme
Lorsqu'on utilise le **switcher de boutiques** dans le header (en haut à droite), et qu'on sélectionne une boutique différente, les données affichées dans les pages ne changent pas pour refléter la boutique sélectionnée.

### Comportement Actuel
Le switcher ajoute `?shop=X` à l'URL, mais ce paramètre n'est pas utilisé par les contrôleurs pour filtrer les données.

---

## 🔍 Analyse

### Architecture Actuelle

**Frontend (AuthenticatedLayout.tsx)**:
```tsx
const activeShopId = query.get('shop') ?? (shops.length > 0 ? shops[0].id : '');
const activeShop = shops.find((shop) => shop.id === activeShopId) ?? shops[0];

// Le switcher change l'URL
<Link href={`${currentPath}?shop=${shop.id}`}>
    {shop.name}
</Link>
```

**Backend**: Les contrôleurs n'utilisent PAS le paramètre `?shop=X`

---

## 💡 Solutions Possibles

### Option 1: Session-Based Shop Context (RECOMMANDÉ)

Au lieu d'utiliser un paramètre GET, stocker la boutique active en **session**.

#### Avantages ✅
- Persiste entre les pages
- Pas de pollution d'URL
- Facile à implémenter
- Compatible avec tous les contrôleurs existants

#### Implémentation

**1. Créer un Middleware**

```bash
php artisan make:middleware SetActiveShop
```

**`app/Http/Middleware/SetActiveShop.php`**:
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SetActiveShop
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            // Si paramètre shop présent, le sauver en session
            if ($request->has('shop')) {
                $shopId = $request->get('shop');
                $userShopIds = Auth::user()->accessibleShops()->pluck('id')->toArray();
                
                // Vérifier que l'utilisateur a accès à cette boutique
                if (in_array($shopId, $userShopIds)) {
                    session(['active_shop_id' => $shopId]);
                }
            }
            
            // Si pas de boutique active en session, prendre la première
            if (!session('active_shop_id')) {
                $firstShop = Auth::user()->accessibleShops()->first();
                if ($firstShop) {
                    session(['active_shop_id' => $firstShop->id]);
                }
            }
        }

        return $next($request);
    }
}
```

**2. Enregistrer le Middleware**

**`bootstrap/app.php`**:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\SetActiveShop::class,
    ]);
})
```

**3. Helper Global**

**`app/Helpers/ShopHelper.php`**:
```php
<?php

namespace App\Helpers;

use App\Models\Shop;
use Illuminate\Support\Facades\Auth;

class ShopHelper
{
    public static function getActiveShop(): ?Shop
    {
        $shopId = session('active_shop_id');
        
        if (!$shopId || !Auth::check()) {
            return null;
        }
        
        return Auth::user()->accessibleShops()->find($shopId);
    }
    
    public static function getActiveShopId(): ?int
    {
        return session('active_shop_id');
    }
}
```

**4. Utiliser dans les Contrôleurs**

**Exemple - ProductController**:
```php
use App\Helpers\ShopHelper;

public function index(Request $request)
{
    $activeShopId = ShopHelper::getActiveShopId();
    
    $query = Product::with(['category', 'shop'])
        ->whereHas('shop', function ($q) use ($activeShopId) {
            $q->where('user_id', Auth::id());
            
            // Filtrer par boutique active si sélectionnée
            if ($activeShopId) {
                $q->where('id', $activeShopId);
            }
        });
    
    // ... reste du code
}
```

**5. Partager avec Inertia**

**`app/Providers/AppServiceProvider.php`**:
```php
use App\Helpers\ShopHelper;

Inertia::share([
    'shops' => function () {
        if (Auth::check()) {
            return Auth::user()->shops()->get()->map(function ($shop) {
                return [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                    'is_active' => $shop->is_active,
                ];
            });
        }
        return [];
    },
    'activeShop' => function () {
        return ShopHelper::getActiveShop();
    },
]);
```

**6. Frontend - Lire depuis props**

**`AuthenticatedLayout.tsx`**:
```tsx
const activeShopFromSession = page.props.activeShop as { id: number; name: string } | null;
const activeShop = activeShopFromSession ?? shops[0];

// Le switcher reste le même
<Link href={`${currentPath}?shop=${shop.id}`}>
    {shop.name}
</Link>
```

---

### Option 2: Query Parameter (Alternative)

Passer le paramètre `?shop=X` à TOUTES les requêtes et le traiter dans chaque contrôleur.

#### Avantages ✅
- URL explicite
- Bookmarkable
- Testable facilement

#### Inconvénients ❌
- Doit modifier TOUS les contrôleurs
- Pollution d'URL
- Perte du contexte si le paramètre est oublié

---

### Option 3: Utiliser Spatie Media Library Context

Utiliser un package comme `spatie/laravel-multitenancy` pour gérer le contexte global.

---

## 🎯 Recommandation

**Option 1 (Session-Based)** est la meilleure solution car :

1. ✅ **Transparent** : Pas besoin de modifier tous les liens
2. ✅ **Persiste** : Reste actif pendant toute la session
3. ✅ **Sécurisé** : Vérifie que l'utilisateur a accès à la boutique
4. ✅ **Simple** : Une seule configuration centralisée
5. ✅ **Flexible** : Peut être étendu facilement

---

## 📋 Checklist d'Implémentation

### Phase 1: Infrastructure
- [ ] Créer `SetActiveShop` middleware
- [ ] Créer `ShopHelper` avec méthodes helper
- [ ] Enregistrer middleware dans `bootstrap/app.php`
- [ ] Partager `activeShop` via Inertia dans `AppServiceProvider`

### Phase 2: Contrôleurs
- [ ] Mettre à jour `ProductController::index()` pour filtrer par boutique active
- [ ] Mettre à jour `CategoryController::index()`
- [ ] Mettre à jour `SaleController::index()`
- [ ] Mettre à jour `StockMovementController::index()`
- [ ] Mettre à jour `InventoryController::index()`
- [ ] Mettre à jour `SupplierController::index()`
- [ ] Mettre à jour `CustomerController::index()`

### Phase 3: Frontend
- [ ] Modifier `AuthenticatedLayout.tsx` pour utiliser `activeShop` depuis props
- [ ] Ajouter indicateur visuel de la boutique active
- [ ] Tester le changement de boutique

### Phase 4: Tests
- [ ] Tester changement de boutique via switcher
- [ ] Vérifier que les données changent effectivement
- [ ] Tester qu'on ne peut pas accéder à une boutique d'un autre utilisateur
- [ ] Tester persistance entre les pages

---

## 🚨 Points d'Attention

### Sécurité
```php
// TOUJOURS vérifier que l'utilisateur a accès à la boutique
$userShopIds = Auth::user()->accessibleShops()->pluck('id')->toArray();
if (in_array($shopId, $userShopIds)) {
    // OK
}
```

### Performance
```php
// Mettre en cache les IDs des boutiques accessibles
$userShopIds = cache()->remember(
    "user_{$user->id}_shops",
    now()->addMinutes(60),
    fn() => $user->accessibleShops()->pluck('id')->toArray()
);
```

### UX
- Ajouter un indicateur visuel clair de la boutique active
- Afficher un message lors du changement de boutique
- Rediriger vers dashboard après changement (optionnel)

---

## 📝 Exemple Complet

### Avant (Problème)
```
User sélectionne "Boutique B" dans le switcher
→ URL change: /products?shop=2
→ Les produits affichés sont TOUJOURS ceux de toutes les boutiques
```

### Après (Solution)
```
User sélectionne "Boutique B" dans le switcher
→ URL change: /products?shop=2
→ Middleware stocke shop_id=2 en session
→ ProductController lit session('active_shop_id')
→ Filtre les produits WHERE shop_id = 2
→ Affiche uniquement les produits de "Boutique B" ✅
```

---

## 🔄 Alternative Rapide (Sans Middleware)

Si vous voulez une solution plus rapide sans middleware:

**Dans chaque contrôleur**:
```php
public function index(Request $request)
{
    $activeShopId = $request->get('shop');
    
    // Vérifier que l'utilisateur a accès
    if ($activeShopId) {
        $hasAccess = Auth::user()->accessibleShops()
            ->where('id', $activeShopId)
            ->exists();
            
        if (!$hasAccess) {
            $activeShopId = null; // Réinitialiser si pas d'accès
        }
    }
    
    $query = Product::with(['category', 'shop'])
        ->whereHas('shop', function ($q) use ($activeShopId) {
            $q->where('user_id', Auth::id());
            
            if ($activeShopId) {
                $q->where('id', $activeShopId);
            }
        });
    
    // ... reste
}
```

**Inconvénient**: Code répété dans chaque contrôleur.

---

**Date**: 24 février 2026  
**Statut**: 📋 PLAN D'ACTION DÉFINI  
**Priorité**: MOYENNE - Amélioration UX importante  
**Effort**: 4-6 heures d'implémentation
