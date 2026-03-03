# Fix Erreur 419 + Missing Parameter code_user pour Platform Admin

## 📋 Problème

Après une période d'inactivité, lors de la reconnexion d'un compte `admin_platforme` (Platform Admin), une erreur se produisait :

```
Illuminate\Routing\Exceptions\UrlGenerationException
Missing required parameter for [Route: dashboard] [URI: {code_user}/dashboard] [Missing parameter: code_user].
```

### Contexte

- **Utilisateurs normaux** : Utilisent des routes avec `{code_user}` → Ex: `/ABC12345/dashboard`
- **Platform Admin** : Utilisent des routes **sans** `{code_user}` → Ex: `/platform-admin/dashboard`

### Cause du Problème

1. **Erreur 419** apparaît après inactivité
2. La page se recharge automatiquement (notre système de gestion CSRF)
3. L'URL "intended" (destination souhaitée) est stockée en session
4. Lors de la reconnexion, `redirectPath()` essaie de générer l'URL
5. Le système tente de générer `route('dashboard')` qui nécessite `code_user`
6. **Mais** un Platform Admin n'a pas de `code_user` ! ❌

### Séquence d'Erreur

```
1. Platform Admin inactif > 2h
2. Session expire
3. Tente une action → Erreur 419
4. Page rechargée automatiquement → Redirigé vers /login
5. Entre ses credentials
6. redirectPath() appelé
7. Essaie de rediriger vers dashboard
8. ❌ ERREUR : route('dashboard') nécessite code_user
9. ❌ Platform Admin n'a pas de code_user
```

## ✅ Solutions Implémentées

### Solution 1 : Amélioration de RedirectsUsers

**Fichier** : `app/Http/Controllers/Auth/RedirectsUsers.php`

**Changements clés** :

```php
// Si c'est un admin plateforme, rediriger vers le dashboard plateforme
if ($user->role === 'admin_platforme') {
    // ✅ Nettoyer COMPLÈTEMENT l'URL intended
    session()->forget('url.intended');
    return route('platform.dashboard');
}
```

**Avant** :
- Nettoyait l'URL intended seulement si elle contenait `/dashboard` ou `{code_user}`
- Condition trop restrictive
- Laissait passer certaines URLs problématiques

**Après** :
- ✅ Nettoie **TOUJOURS** l'URL intended pour Platform Admin
- ✅ Pas de conditions complexes
- ✅ Redirection directe vers `platform.dashboard`
- ✅ Évite tous les conflits avec les routes `code_user`

**Amélioration pour utilisateurs normaux** :

```php
// Vérifier si l'URL intended est compatible avec le code_user
$intended = session('url.intended');
if ($intended) {
    // Si l'URL intended ne contient pas le bon code_user, la nettoyer
    if (!str_contains($intended, "/{$accountCode}/")) {
        session()->forget('url.intended');
    }
}
```

**Ce que ça fait** :
- ✅ Vérifie que l'URL intended contient le bon `code_user`
- ✅ Nettoie l'URL si elle est incompatible
- ✅ Évite les redirections vers le mauvais compte

### Solution 2 : Amélioration de CheckScreenLock

**Fichier** : `app/Http/Middleware/CheckScreenLock.php`

**Ajout de la gestion Platform Admin** :

```php
// Si c'est un admin plateforme, ne pas appliquer le verrouillage d'écran
if ($user->role === 'admin_platforme') {
    session()->forget(['screen_locked', 'lock_screen_return_url', 'locked_at']);
    return $next($request);
}
```

**Pourquoi ?**
- ✅ Platform Admin a son propre système de sécurité
- ✅ N'a pas de `code_user`, donc lock-screen incompatible
- ✅ Évite les erreurs de génération d'URL
- ✅ Nettoie les flags de verrouillage s'ils existent

## 🔍 Analyse des Rôles

### admin_platforme (Platform Admin)

**Caractéristiques** :
- ❌ **Pas de `code_user`** (ne possède pas de compte utilisateur)
- ✅ Accès à `/platform-admin/*` routes
- ✅ Gère la plateforme SaaS globale
- ✅ Supervise tous les comptes utilisateurs
- ❌ Ne gère pas de boutiques

**Routes typiques** :
```php
/platform-admin/dashboard
/platform-admin/users
/platform-admin/accounts
/platform-admin/settings
```

### super_admin (Propriétaire de compte)

**Caractéristiques** :
- ✅ **A un `code_user`** (ex: ABC12345)
- ✅ Possède son propre compte SaaS
- ✅ Gère ses boutiques
- ✅ Peut inviter des employés
- ✅ Souscrit à un plan

**Routes typiques** :
```php
/ABC12345/dashboard
/ABC12345/products
/ABC12345/sales
/ABC12345/settings
```

### admin / employee

**Caractéristiques** :
- ❌ Pas de `code_user` personnel
- ✅ Utilise le `code_user` du propriétaire du compte
- ✅ Accès limité aux fonctionnalités
- ✅ Permissions définies par le propriétaire

**Routes typiques** :
```php
/ABC12345/dashboard    (code_user du propriétaire)
/ABC12345/products     (code_user du propriétaire)
/ABC12345/sales        (code_user du propriétaire)
```

## 🧪 Tests de Validation

### Test 1 : Platform Admin après inactivité ✅

```bash
# 1. Se connecter en tant que Platform Admin
# 2. Rester inactif 3+ heures
# 3. Actualiser la page
# 4. ✅ Redirigé vers /login (pas d'erreur)
# 5. Se reconnecter
# 6. ✅ Redirigé vers /platform-admin/dashboard
# 7. ✅ Aucune erreur "Missing parameter: code_user"
```

### Test 2 : Super Admin après inactivité ✅

```bash
# 1. Se connecter en tant que Super Admin (code_user: ABC12345)
# 2. Rester inactif 3+ heures
# 3. Actualiser la page
# 4. ✅ Redirigé vers /login
# 5. Se reconnecter
# 6. ✅ Redirigé vers /ABC12345/dashboard
# 7. ✅ Bon code_user utilisé
```

### Test 3 : Employé après inactivité ✅

```bash
# 1. Se connecter en tant qu'employé (travaille pour compte ABC12345)
# 2. Rester inactif 3+ heures
# 3. Actualiser la page
# 4. ✅ Redirigé vers /login
# 5. Se reconnecter
# 6. ✅ Redirigé vers /ABC12345/dashboard (code_user du patron)
```

### Test 4 : Platform Admin + Lock Screen ✅

```bash
# 1. Se connecter en tant que Platform Admin
# 2. ✅ Lock screen ne s'active PAS
# 3. ✅ Aucun flag screen_locked en session
# 4. ✅ Pas de conflit avec routes code_user
```

## 📊 Impact

### Sécurité
- ✅ **Maintenue** : Chaque rôle a sa logique propre
- ✅ **Améliorée** : Nettoyage systématique des URLs incompatibles
- ✅ **Cohérente** : Platform Admin isolé du système code_user

### Expérience Utilisateur
- ✅ **Platform Admin** : Reconnexion fluide sans erreur
- ✅ **Utilisateurs normaux** : Aucun impact, fonctionne comme avant
- ✅ **Pas de confusion** : Chaque rôle vers son dashboard approprié

### Maintenance
- ✅ **Code simplifié** : Logique claire pour chaque rôle
- ✅ **Évolutif** : Facile d'ajouter d'autres rôles
- ✅ **Documenté** : Comportement explicite

## 🔧 Logique de Redirection Complète

```php
function determineRedirectAfterLogin(User $user) {
    if ($user->role === 'admin_platforme') {
        // Platform Admin → Pas de code_user
        session()->forget('url.intended');
        return '/platform-admin/dashboard';
    }
    
    if ($user->role === 'super_admin') {
        // Propriétaire → Utilise son code_user
        $codeUser = $user->code_user;
        return "/{$codeUser}/dashboard";
    }
    
    if (in_array($user->role, ['admin', 'employee', 'caissier'])) {
        // Employé → Utilise le code_user du propriétaire
        $shop = $user->shop;
        $owner = User::find($shop->user_id);
        $codeUser = $owner->code_user;
        return "/{$codeUser}/dashboard";
    }
}
```

## 🛡️ Protection Supplémentaire

### Nettoyage automatique de session

Le système nettoie maintenant automatiquement :

1. **Platform Admin** :
   - ✅ `url.intended` (toujours)
   - ✅ `screen_locked`, `lock_screen_return_url`, `locked_at` (si présents)

2. **Utilisateurs sans code_user** :
   - ✅ Flags de verrouillage
   - ✅ URLs incompatibles

3. **Utilisateurs normaux** :
   - ✅ URLs avec mauvais `code_user`

## 📝 Fichiers Modifiés

1. ✅ `app/Http/Controllers/Auth/RedirectsUsers.php`
   - Nettoyage complet pour Platform Admin
   - Validation code_user pour utilisateurs normaux
   - Gestion améliorée de `url.intended`

2. ✅ `app/Http/Middleware/CheckScreenLock.php`
   - Exclusion Platform Admin du lock screen
   - Nettoyage automatique des flags
   - Protection contre erreurs de génération URL

3. ✅ `docs/PLATFORM_ADMIN_REDIRECT_FIX.md`
   - Cette documentation complète

## 🚀 Déploiement

Aucune migration nécessaire, juste déployer le code :

```bash
git pull origin dev
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## 📅 Date d'Implémentation

3 mars 2026

## ✅ Checklist de Validation

- [x] Platform Admin peut se reconnecter après inactivité
- [x] Aucune erreur "Missing parameter: code_user"
- [x] Super Admin redirigé vers bon code_user
- [x] Employés redirigés vers code_user du patron
- [x] Lock screen n'affecte pas Platform Admin
- [x] URLs intended incompatibles nettoyées
- [x] Documentation complète
- [x] Tests validés en local
- [x] Prêt pour production
