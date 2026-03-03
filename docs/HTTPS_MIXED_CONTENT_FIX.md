# Fix Mixed Content & CSRF 419 sur HTTPS

## 📋 Problème Rencontré

Lors de l'utilisation de l'application en production (HTTPS), deux erreurs critiques apparaissaient :

### 1. **Mixed Content Error**
```
Mixed Content: The page at 'https://dev.batixpro.com/login' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://dev.batixpro.com/platform-admin/dashboard'. 
This request has been blocked; the content must be served over HTTPS.
```

**Cause** : L'application générait des URLs avec `http://` au lieu de `https://` même en production HTTPS.

### 2. **Erreur 419 en Boucle sur Login**
```
POST https://dev.batixpro.com/login 419
```

**Cause** : L'intercepteur CSRF tentait de rafraîchir le token sur la page de login, créant une boucle infinie.

## ✅ Solutions Implémentées

### Solution 1 : Forcer HTTPS en Production

**Fichier** : `app/Providers/AppServiceProvider.php`

```php
use Illuminate\Support\Facades\URL;

public function boot(): void
{
    // Forcer HTTPS en production
    if ($this->app->environment('production') || request()->server('HTTP_X_FORWARDED_PROTO') === 'https') {
        URL::forceScheme('https');
    }
    
    // ... reste du code
}
```

**Ce que ça fait** :
- ✅ Force toutes les URLs générées à utiliser `https://` au lieu de `http://`
- ✅ Fonctionne avec les proxies inverses (nginx, etc.)
- ✅ Détecte automatiquement l'environnement de production
- ✅ Respecte le header `X-Forwarded-Proto` envoyé par le proxy

### Solution 2 : Configuration TrustProxies

**Fichier créé** : `app/Http/Middleware/TrustProxies.php`

```php
<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    protected $proxies = '*';

    protected $headers =
        Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO |
        Request::HEADER_X_FORWARDED_AWS_ELB;
}
```

**Fichier modifié** : `bootstrap/app.php`

```php
->withMiddleware(function (Middleware $middleware): void {
    // ...
    
    $middleware->trustProxies(at: [
        '*',
    ]);
    
    // ...
})
```

**Ce que ça fait** :
- ✅ Laravel fait confiance aux headers du proxy (nginx, cloudflare, etc.)
- ✅ Détecte correctement si la requête originale était en HTTPS
- ✅ Permet à `URL::forceScheme()` de fonctionner correctement
- ✅ Essentiel pour les déploiements derrière un reverse proxy

### Solution 3 : Amélioration de l'Intercepteur CSRF

**Fichier** : `resources/js/bootstrap.ts`

**Changements clés** :

1. **Détection améliorée des pages d'authentification** :
```typescript
const isAuthPage = window.location.pathname.includes('/login') || 
                 window.location.pathname.includes('/register') ||
                 window.location.pathname.includes('/forgot-password') ||
                 window.location.pathname.includes('/platform-admin/login');
```

2. **Comportement différencié** :
```typescript
// Sur les pages d'auth, ne pas tenter de retry, juste recharger
if (isAuthPage) {
    console.log('CSRF token expired on auth page, reloading...');
    window.location.reload();
    return Promise.reject(error);
}
```

3. **Protection contre les boucles infinies** :
```typescript
let isRefreshingCSRF = false;

if (error.response?.status === 419 && !originalRequest._retry && !isRefreshingCSRF) {
    isRefreshingCSRF = true;
    // ... logique de refresh ...
    isRefreshingCSRF = false;
}
```

**Ce que ça fait** :
- ✅ Empêche les tentatives de retry sur les pages de login
- ✅ Évite les boucles infinies de refresh
- ✅ Recharge simplement la page pour obtenir un nouveau token sur login
- ✅ Utilise le système de retry intelligent sur les autres pages

## 🔧 Configuration Nginx Recommandée

Pour que tout fonctionne correctement, votre configuration nginx devrait inclure :

```nginx
server {
    listen 443 ssl http2;
    server_name dev.batixpro.com;
    
    # ... certificats SSL ...
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # ← Important !
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name dev.batixpro.com;
    return 301 https://$server_name$request_uri;
}
```

**Headers critiques** :
- `X-Forwarded-Proto` : Indique le protocole original (https)
- `X-Forwarded-Host` : Indique le nom d'hôte original
- `X-Forwarded-Port` : Indique le port original (443)

## 🧪 Tests de Validation

### Test 1 : Mixed Content Résolu ✅
```bash
# 1. Ouvrir https://dev.batixpro.com
# 2. Inspecter console navigateur
# 3. Vérifier qu'aucune erreur "Mixed Content" n'apparaît
# 4. Toutes les requêtes doivent être en HTTPS
```

### Test 2 : Login après Inactivité ✅
```bash
# 1. Se connecter à l'application
# 2. Rester inactif 3+ heures
# 3. Actualiser la page → Redirigé vers /login
# 4. Essayer de se connecter
# 5. ✅ Devrait fonctionner sans erreur 419
# 6. ✅ Page se recharge une fois si token expiré, puis login fonctionne
```

### Test 3 : Génération d'URLs ✅
```bash
# Dans tinker :
php artisan tinker
>>> url('/dashboard')
# Devrait retourner : "https://dev.batixpro.com/dashboard"
# PAS "http://dev.batixpro.com/dashboard"
```

### Test 4 : Redirect Intended ✅
```bash
# 1. Essayer d'accéder à une page protégée sans être connecté
# 2. Être redirigé vers /login
# 3. Se connecter
# 4. ✅ Être redirigé vers la page originale demandée
# 5. ✅ L'URL doit être en HTTPS
```

## 📊 Impact

### Sécurité
- ✅ **Améliorée** : Tout le trafic est maintenant en HTTPS
- ✅ **Conforme** : Respect des standards de sécurité web modernes
- ✅ **Protection CSRF** : Toujours active et fonctionnelle

### Expérience Utilisateur
- ✅ **Pas de warning navigateur** : Plus d'erreurs "Mixed Content"
- ✅ **Login fluide** : Fonctionne du premier coup même après inactivité
- ✅ **Redirections correctes** : Les utilisateurs arrivent où ils doivent être

### Performance
- ✅ **Aucun impact négatif** : Les changements sont légers
- ✅ **Moins d'erreurs** : Moins de tentatives de retry inutiles
- ✅ **Cache navigateur** : Mieux respecté avec URLs cohérentes

## 🔍 Debugging

### Si Mixed Content persiste :

1. **Vérifier la configuration nginx** :
```bash
sudo nginx -t
sudo nginx -s reload
```

2. **Vérifier les headers** :
```bash
curl -I https://dev.batixpro.com
# Doit inclure : X-Forwarded-Proto: https
```

3. **Vérifier APP_URL dans .env** :
```env
APP_URL=https://dev.batixpro.com  # PAS http://
```

4. **Vider le cache Laravel** :
```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### Si erreur 419 persiste :

1. **Vérifier le token CSRF dans la page** :
```javascript
// Dans la console navigateur :
document.querySelector('meta[name="csrf-token"]').content
// Doit retourner un token valide
```

2. **Vérifier les cookies** :
```javascript
// Dans la console navigateur :
document.cookie
// Doit inclure : XSRF-TOKEN et laravel_session
```

3. **Vérifier la configuration session** :
```bash
# Dans .env :
SESSION_DRIVER=database
SESSION_DOMAIN=.batixpro.com  # Avec le point pour sous-domaines
SESSION_SECURE_COOKIE=true    # Important pour HTTPS
SESSION_SAME_SITE=lax
```

## 📝 Fichiers Modifiés

1. ✅ `app/Providers/AppServiceProvider.php` - Force HTTPS
2. ✅ `app/Http/Middleware/TrustProxies.php` - Nouveau middleware
3. ✅ `bootstrap/app.php` - Enregistrement TrustProxies
4. ✅ `resources/js/bootstrap.ts` - Intercepteur CSRF amélioré
5. ✅ `docs/HTTPS_MIXED_CONTENT_FIX.md` - Cette documentation

## 🚀 Déploiement

### Étapes de déploiement :

```bash
# 1. Pull les changements
git pull origin dev

# 2. Installer/mettre à jour les dépendances si nécessaire
composer install --optimize-autoloader --no-dev
npm install && npm run build

# 3. Vider les caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# 4. Vérifier la configuration
php artisan config:cache
php artisan route:cache

# 5. Redémarrer les services
sudo systemctl restart php8.3-fpm
sudo systemctl reload nginx
```

### Variables d'environnement à vérifier :

```env
APP_ENV=production
APP_URL=https://dev.batixpro.com
APP_DEBUG=false

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=.batixpro.com

SANCTUM_STATEFUL_DOMAINS=dev.batixpro.com,www.batixpro.com
```

## 📅 Date d'Implémentation

3 mars 2026

## ✅ Validation Finale

- [x] Mixed Content errors éliminées
- [x] HTTPS forcé en production
- [x] TrustProxies configuré
- [x] Intercepteur CSRF amélioré
- [x] Tests validés en production
- [x] Documentation complète
- [x] Équipe informée
