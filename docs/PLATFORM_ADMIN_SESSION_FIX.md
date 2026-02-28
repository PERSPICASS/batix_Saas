# 🔧 Fix: Erreur de Session Platform Admin

## 🐛 Problème

Lorsqu'un `admin_platforme` se reconnecte après l'expiration de sa session, une erreur se produit :

```
Illuminate\Routing\Exceptions\UrlGenerationException
Missing required parameter for [Route: dashboard] [URI: {code_user}/dashboard] [Missing parameter: code_user].
```

## 🔍 Cause Racine

L'admin plateforme n'a pas de `code_user` ni de boutiques, mais plusieurs parties du code essayaient de :
1. Accéder à ses boutiques via `accessibleShops()`
2. Générer l'URL du dashboard avec `route('dashboard')` qui nécessite le paramètre `code_user`
3. Définir une boutique active en session via le middleware `SetActiveShop`

## ✅ Solution Implémentée

### 1. Middleware `SetActiveShop`

**Fichier**: `app/Http/Middleware/SetActiveShop.php`

**Modification**: Ajout d'une vérification pour skip les admins plateforme

```php
public function handle(Request $request, Closure $next): Response
{
    if (Auth::check()) {
        $user = Auth::user();
        
        // Skip pour les admins plateforme qui n'ont pas de boutiques
        if ($user->role === 'admin_platforme') {
            return $next($request);
        }
        
        // ... reste du code
    }
    
    return $next($request);
}
```

**Impact**: Le middleware ne tente plus de trouver des boutiques pour l'admin plateforme.

---

### 2. Modèle `User` - Méthode `accessibleShops()`

**Fichier**: `app/Models/User.php`

**Modification**: Retour d'une collection vide pour admin plateforme

```php
public function accessibleShops()
{
    if ($this->role === 'admin_platforme') {
        // Admin plateforme n'a pas de boutiques personnelles
        return collect([]);
    }
    
    if ($this->role === 'super_admin') {
        return $this->shops;
    }
    
    return $this->shop ? collect([$this->shop]) : collect([]);
}
```

**Impact**: Plus d'erreur quand on appelle `$user->accessibleShops()` pour un admin plateforme.

---

### 3. Modèle `User` - Méthode `getDashboardUrl()`

**Fichier**: `app/Models/User.php`

**Modification**: Redirection vers le dashboard plateforme

```php
public function getDashboardUrl(?Shop $shop = null): string
{
    // Admin plateforme a son propre dashboard
    if ($this->role === 'admin_platforme') {
        return route('platform.dashboard');
    }
    
    $shop = $shop ?? $this->shops()->first();
    
    if ($shop) {
        return route('dashboard.user', [
            'code_user' => $this->code_user,
            'shop_slug' => $shop->slug
        ]);
    }
    
    // Si pas de shop et pas admin plateforme, rediriger vers le dashboard avec code_user
    if ($this->code_user) {
        return route('dashboard', ['code_user' => $this->code_user]);
    }
    
    // Fallback vers login si rien ne fonctionne
    return route('login');
}
```

**Impact**: L'admin plateforme est correctement redirigé vers `/platform/dashboard`.

---

## ✅ Résultat

Après ces modifications :

1. ✅ L'admin plateforme peut se reconnecter sans erreur après expiration de session
2. ✅ Il est automatiquement redirigé vers `/platform/dashboard`
3. ✅ Le middleware `SetActiveShop` n'essaie pas de charger des boutiques inexistantes
4. ✅ `accessibleShops()` retourne une collection vide (correct pour admin plateforme)
5. ✅ Pas d'erreur "Missing required parameter: code_user"

---

## 🧪 Tests

### Test 1: Reconnexion Admin Plateforme
1. Se connecter en tant qu'admin plateforme
2. Attendre expiration de la session (ou supprimer les cookies)
3. Se reconnecter avec les identifiants
4. ✅ Devrait rediriger vers `/platform/dashboard` sans erreur

### Test 2: Accès Direct Dashboard
1. Se connecter en tant qu'admin plateforme
2. Tenter d'accéder à `/platform/dashboard`
3. ✅ Devrait charger le dashboard correctement

### Test 3: Autres Rôles Non Affectés
1. Se reconnecter en tant que `super_admin`
2. ✅ Devrait rediriger vers `/{code_user}/dashboard` normalement
3. Se reconnecter en tant que `manager` ou `employee`
4. ✅ Devrait rediriger vers la boutique assignée normalement

---

## 📝 Notes Techniques

### Architecture des Rôles

| Rôle | code_user | Boutiques | Dashboard |
|------|-----------|-----------|-----------|
| `admin_platforme` | ❌ NULL | ❌ Aucune | `/platform/dashboard` |
| `super_admin` | ✅ Oui | ✅ Plusieurs | `/{code_user}/dashboard` |
| `manager` | ❌ NULL | ✅ Une assignée | `/{code_user}/{shop_slug}/dashboard` |
| `employee` | ❌ NULL | ✅ Une assignée | `/{code_user}/{shop_slug}/dashboard` |

### Trait `RedirectsUsers`

**Fichier**: `app/Http/Controllers/Auth/RedirectsUsers.php`

Le trait gère déjà correctement la redirection pour l'admin plateforme :

```php
if ($user->role === 'admin_platforme') {
    return route('platform.dashboard');
}
```

✅ Aucune modification nécessaire ici.

---

## 🔄 Fichiers Modifiés

1. ✅ `app/Http/Middleware/SetActiveShop.php`
2. ✅ `app/Models/User.php` (2 méthodes)
3. ✅ `docs/PLATFORM_ADMIN_SESSION_FIX.md` (ce document)

---

## 📅 Date de Résolution

28 février 2026

## 🎯 Statut

✅ **RÉSOLU** - L'admin plateforme peut maintenant se reconnecter sans erreur.
