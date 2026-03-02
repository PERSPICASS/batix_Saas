# Fix - Reconnexion Admin Plateforme après Inactivité

**Date**: 2 mars 2026  
**Statut**: ✅ Corrigé

## Problème Rencontré

### Erreur
```
Illuminate\Routing\Exceptions\UrlGenerationException
Missing required parameter for [Route: dashboard] [URI: {code_user}/dashboard] [Missing parameter: code_user].
```

### Contexte
Lorsqu'un utilisateur `admin_platforme` était inactif pendant un certain temps et essayait de se reconnecter, le système générait une erreur `UrlGenerationException` indiquant qu'un paramètre `code_user` était manquant pour la route `dashboard`.

### Cause Racine
Le problème était causé par plusieurs facteurs :

1. **Session "intended" persistante** : Laravel stocke l'URL que l'utilisateur tentait d'accéder avant de se déconnecter dans `session('url.intended')`. Cette URL pouvait pointer vers une route `dashboard` qui nécessite un paramètre `code_user`.

2. **Middleware CheckScreenLock** : Le middleware détectait une session `screen_locked` même après logout et essayait de rediriger vers `lock-screen.show` qui nécessite aussi un `code_user`.

3. **Redirection inadaptée** : Les utilisateurs `admin_platforme` n'ont pas de `code_user` car ils ne sont pas propriétaires de boutiques, mais le système essayait quand même de les rediriger vers une route avec `code_user`.

## Solutions Implémentées

### 1. Middleware CheckScreenLock

**Fichier**: `app/Http/Middleware/CheckScreenLock.php`

**Changement** : Ajout d'une vérification du `code_user` avant redirection

```php
public function handle(Request $request, Closure $next): Response
{
    if (Auth::check() && session('screen_locked')) {
        $user = Auth::user();
        
        // Vérifier que l'utilisateur a un code_user
        if (!$user || !$user->code_user) {
            // Si pas de code_user, nettoyer la session et continuer
            session()->forget(['screen_locked', 'lock_screen_return_url', 'locked_at']);
            return $next($request);
        }
        
        // ... reste du code
    }
    
    return $next($request);
}
```

**Effet** : Si un utilisateur n'a pas de `code_user` (comme `admin_platforme`), la session de verrouillage d'écran est automatiquement nettoyée et la requête continue normalement.

### 2. Nettoyage Explicite lors du Logout

**Fichier**: `app/Http/Controllers/Auth/AuthenticatedSessionController.php`

**Changement** : Nettoyage explicite des données de lock screen

```php
public function destroy(Request $request): RedirectResponse
{
    ActivityLogger::logout();

    // Clean lock screen session data before logout
    $request->session()->forget(['screen_locked', 'lock_screen_return_url', 'locked_at']);

    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
}
```

**Effet** : Garantit que toutes les données de verrouillage d'écran sont supprimées avant l'invalidation de la session.

### 3. Gestion de l'URL "intended" pour admin_platforme

**Fichier**: `app/Http/Controllers/Auth/RedirectsUsers.php`

**Changement** : Nettoyage de l'URL intended si elle contient des routes incompatibles

```php
protected function redirectPath(): string
{
    $user = auth()->user();
    
    if (!$user) {
        return route('login');
    }
    
    // Si c'est un admin plateforme, rediriger vers le dashboard plateforme
    if ($user->role === 'admin_platforme') {
        // Nettoyer l'URL intended si elle contient une route qui nécessite code_user
        $intended = session('url.intended');
        if ($intended && (str_contains($intended, '/dashboard') || str_contains($intended, '{code_user}'))) {
            session()->forget('url.intended');
        }
        return route('platform.dashboard');
    }
    
    // ... reste du code
}
```

**Effet** : Avant de rediriger un `admin_platforme`, le système vérifie si l'URL "intended" stockée en session contient des références à `dashboard` ou `code_user`. Si oui, cette URL est supprimée pour éviter les erreurs.

## Flux de Reconnexion Corrigé

### Avant le Fix
1. Admin plateforme inactif → Session contient `url.intended` = `/{code_user}/dashboard`
2. Tentative de reconnexion → `redirect()->intended()` essaie de générer l'URL
3. ❌ **ERREUR** : Route `dashboard` nécessite `code_user` mais `admin_platforme` n'en a pas

### Après le Fix
1. Admin plateforme inactif → Session peut contenir `url.intended`
2. Tentative de reconnexion → `redirectPath()` détecte le rôle `admin_platforme`
3. ✅ Nettoyage de `url.intended` si elle contient `/dashboard` ou `{code_user}`
4. ✅ Redirection vers `route('platform.dashboard')`
5. ✅ Connexion réussie !

## Rôles Affectés

### admin_platforme
- ✅ N'a **pas** de `code_user`
- ✅ Redirigé vers `/platform-admin/dashboard`
- ✅ N'est pas affecté par les routes avec `{code_user}`

### super_admin
- ✅ A un `code_user`
- ✅ Redirigé vers `/{code_user}/dashboard`
- ✅ Fonctionne normalement avec toutes les routes

### admin, caissier, gestionnaire_stock
- ✅ Héritent du `code_user` de leur propriétaire
- ✅ Redirigés vers `/{code_user}/dashboard`
- ✅ Fonctionnent normalement

## Tests Recommandés

### Test 1 : Reconnexion admin_platforme
1. ✅ Se connecter en tant qu'`admin_platforme`
2. ✅ Naviguer vers différentes pages du dashboard plateforme
3. ✅ Se déconnecter
4. ✅ Se reconnecter
5. ✅ **Résultat attendu** : Redirection vers `/platform-admin/dashboard` sans erreur

### Test 2 : Inactivité prolongée admin_platforme
1. ✅ Se connecter en tant qu'`admin_platforme`
2. ✅ Attendre le timeout de session (ou simuler)
3. ✅ Tenter d'accéder à une page
4. ✅ Redirection vers login
5. ✅ Se reconnecter
6. ✅ **Résultat attendu** : Pas d'erreur, redirection correcte

### Test 3 : Lock screen avec admin_platforme
1. ✅ Se connecter en tant qu'`admin_platforme`
2. ✅ Verrouiller l'écran (si activé)
3. ✅ Déverrouiller
4. ✅ **Résultat attendu** : Pas d'erreur liée à `code_user`

### Test 4 : Autres rôles non affectés
1. ✅ Se connecter avec `super_admin`, `admin`, etc.
2. ✅ Suivre les mêmes scénarios
3. ✅ **Résultat attendu** : Comportement inchangé, fonctionnement normal

## Sécurité

### Vérifications Maintenues
- ✅ Authentification toujours requise pour accéder aux routes protégées
- ✅ Vérification du rôle dans chaque contrôleur admin plateforme
- ✅ Session régénérée lors du login
- ✅ Token CSRF régénéré lors du logout

### Améliorations
- ✅ Nettoyage automatique des sessions invalides
- ✅ Prévention des tentatives de génération d'URL invalides
- ✅ Gestion gracieuse des cas limites (utilisateur sans `code_user`)

## Fichiers Modifiés

1. ✅ `app/Http/Middleware/CheckScreenLock.php`
2. ✅ `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
3. ✅ `app/Http/Controllers/Auth/RedirectsUsers.php`
4. ✅ `resources/js/Pages/Welcome.tsx`

## Problèmes Connexes Résolus

### 404 Not Found sur Landing Page

**Symptôme** : Erreur 404 lors du clic sur "Dashboard" depuis la landing page

**Cause** : La fonction `getDashboardUrl()` dans `Welcome.tsx` ne gérait pas le cas des utilisateurs `admin_platforme` qui n'ont pas de `code_user`.

**Solution** :
```tsx
const getDashboardUrl = () => {
    if (!auth.user) {
        return route('register');
    }
    
    // Si l'utilisateur est admin_platforme, rediriger vers le dashboard plateforme
    if (auth.user.role === 'admin_platforme') {
        return route('platform.dashboard');
    }
    
    // Sinon, utiliser le code_user pour les autres rôles
    if (auth.code_user) {
        return route('dashboard', { code_user: auth.code_user });
    }
    
    // Fallback vers register si pas de code_user
    return route('register');
};
```

**Effet** : Les utilisateurs `admin_platforme` sont maintenant correctement redirigés vers leur dashboard plateforme depuis la landing page.

## Conclusion

Ces corrections assurent que les utilisateurs `admin_platforme` peuvent se reconnecter sans problème après une période d'inactivité, tout en maintenant le fonctionnement normal pour les autres types d'utilisateurs. Le système gère maintenant correctement les cas où un utilisateur n'a pas de `code_user`.

---

**Corrigé le** : 2 mars 2026  
**Testé** : En attente de tests utilisateur  
**Statut** : ✅ Déployé en dev
