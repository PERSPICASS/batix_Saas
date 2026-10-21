# Correction : Erreur de Lock Screen lors de la reconnexion

**Date:** 2 mars 2026  
**Statut:** ✅ Corrigé

## Problème

Lorsqu'un utilisateur était inactif sur la plateforme et revenait se connecter, une erreur se produisait :

```
Illuminate\Routing\Exceptions\UrlGenerationException
Missing required parameter for [Route: dashboard] [URI: {code_user}/dashboard] [Missing parameter: code_user].
```

### Cause

Le middleware `CheckScreenLock` détectait que la session contenait encore `screen_locked = true` de la session précédente. Pendant le processus de login (POST `/login`), après l'authentification mais avant la redirection vers le dashboard, le middleware tentait de rediriger vers `lock-screen.show`, ce qui entrait en conflit avec la redirection normale du login vers le dashboard (qui nécessite le paramètre `code_user`).

### Flux problématique

```
1. Utilisateur inactif → Session expire mais screen_locked reste
2. POST /login → Authentification réussie
3. Middleware CheckScreenLock → Détecte screen_locked = true
4. Tente redirect()->route('lock-screen.show')
5. Conflit avec redirect()->intended($this->redirectPath())
6. ❌ Erreur: Missing parameter code_user
```

## Solution

Nettoyer automatiquement la session de verrouillage d'écran lors d'une **nouvelle connexion**.

### Modification apportée

**Fichier:** `app/Http/Controllers/Auth/AuthenticatedSessionController.php`

```php
public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();

    $request->session()->regenerate();

    // ✅ Nettoyer la session de verrouillage d'écran lors d'une nouvelle connexion
    $request->session()->forget(['screen_locked', 'lock_screen_return_url', 'locked_at']);

    // Log the login activity
    ActivityLogger::login();

    return redirect()->intended($this->redirectPath());
}
```

### Logique

Lors d'une **nouvelle connexion** (après avoir saisi email + mot de passe), il est logique de **déverrouiller automatiquement** l'écran car :

1. L'utilisateur vient de prouver son identité avec ses credentials
2. Une nouvelle session est créée avec `regenerate()`
3. Le verrouillage d'écran est conçu pour les pauses courtes, pas pour remplacer le login
4. Si la session a expiré, l'utilisateur doit se reconnecter (ce qui est plus sécurisé qu'un simple unlock)

### Flux corrigé

```
1. Utilisateur inactif → Session expire
2. POST /login → Authentification réussie
3. Session régénérée + nettoyage de screen_locked
4. Middleware CheckScreenLock → Pas de screen_locked, continue
5. Redirection vers /{code_user}/dashboard
6. ✅ Succès
```

## Différence importante

### Lock Screen (écran verrouillé)
- **Quand ?** Pause courte pendant une session active
- **Déverrouillage ?** Saisie du mot de passe uniquement
- **Session ?** Reste active
- **Durée ?** Minutes/heures

### Logout/Login (déconnexion complète)
- **Quand ?** Fin de session ou expiration
- **Connexion ?** Email + mot de passe
- **Session ?** Nouvelle session créée
- **Durée ?** Jours/semaines

## Alternative envisagée (non retenue)

On aurait pu modifier le middleware pour ignorer la route POST `/login` :

```php
// Dans CheckScreenLock.php
$excludedRoutes = [
    'lock-screen.show', 
    'lock-screen.unlock', 
    'logout',
    'login', // ✅ Déjà présent
];
```

**Problème :** Même avec cette exclusion, si on fait `redirect()->intended()` après le login, la requête suivante (GET du dashboard) aurait encore `screen_locked = true` et causerait une boucle de redirection.

**Solution retenue :** Nettoyer la session directement dans le contrôleur de login est plus propre et garantit qu'une nouvelle connexion = écran déverrouillé.

## Tests effectués

- [x] Login après inactivité → ✅ Redirige vers dashboard sans erreur
- [x] Lock screen manuel → ✅ Fonctionne toujours
- [x] Unlock screen → ✅ Retourne à l'URL précédente
- [x] Logout puis login → ✅ Pas de screen_locked résiduel

## Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Ajout du nettoyage de session dans la méthode `store()` |

## Conclusion

Le problème de redirection lors de la reconnexion après inactivité est maintenant résolu. Une nouvelle connexion nettoie automatiquement le verrouillage d'écran, permettant une redirection normale vers le dashboard avec le bon paramètre `code_user`.

---

**Documentation connexe:**
- [LOCK_SCREEN_GUIDE.md](./LOCK_SCREEN_GUIDE.md) - Guide du système de verrouillage d'écran
- [LOCK_SCREEN_IMPLEMENTATION.md](./LOCK_SCREEN_IMPLEMENTATION.md) - Implémentation technique
