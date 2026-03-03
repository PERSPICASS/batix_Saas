# Guide de Déploiement Fix HTTPS

## 🚨 Problème à Résoudre

Les URLs générées en session utilisent `http://` au lieu de `https://`, causant des erreurs Mixed Content.

## ✅ Étapes de Déploiement

### 1. Vérifier la Configuration .env

Assurez-vous que votre `.env` contient :

```env
APP_ENV=production
APP_URL=https://dev.batixpro.com

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=.batixpro.com

SANCTUM_STATEFUL_DOMAINS=dev.batixpro.com,www.batixpro.com
```

**⚠️ Important** : `APP_URL` doit être en `https://` !

### 2. Exécuter le Script de Déploiement

```bash
# Rendre le script exécutable
chmod +x fix_https_deploy.sh

# Exécuter
./fix_https_deploy.sh
```

Le script fait automatiquement :
- ✅ Vide tous les caches Laravel
- ✅ Recompile la configuration
- ✅ Compile les assets frontend (npm run build)

### 3. Redémarrer les Services

```bash
# Redémarrer PHP-FPM
sudo systemctl restart php8.3-fpm

# Recharger Nginx
sudo systemctl reload nginx
```

### 4. Nettoyer les Sessions Existantes (Optionnel mais Recommandé)

Les sessions existantes peuvent contenir des URLs en `http://`. Pour éviter les problèmes :

**Option A : Vider toutes les sessions** (rapide mais déconnecte tout le monde)
```bash
php artisan session:flush
```

**Option B : Nettoyer la table sessions** (si driver=database)
```sql
-- Dans MySQL
TRUNCATE TABLE sessions;
```

**Option C : Laisser expirer naturellement**
Les sessions expireront naturellement et le nouveau middleware corrigera les nouvelles.

## 🧪 Vérification

### Test 1 : Vérifier la Compilation Assets

```bash
# Vérifier que les nouveaux assets sont générés
ls -lh public/build/

# Le fichier manifest.json doit avoir une date récente
cat public/build/manifest.json
```

### Test 2 : Vérifier la Configuration

```bash
php artisan config:show app.url
# Doit afficher : https://dev.batixpro.com

php artisan config:show session.secure
# Doit afficher : true
```

### Test 3 : Test Navigateur

1. **Vider le cache navigateur** (Ctrl+Shift+Delete)
2. Ouvrir en navigation privée : `https://dev.batixpro.com`
3. ✅ Aucune erreur Mixed Content dans la console
4. Se connecter → ✅ Devrait fonctionner sans erreur

### Test 4 : Test après Inactivité

1. Se connecter
2. Attendre 3+ heures (ou réduire `SESSION_LIFETIME` pour tester)
3. Actualiser la page
4. Se reconnecter
5. ✅ Aucune erreur Mixed Content
6. ✅ Aucune erreur 419 en boucle

## 🔍 Debugging

### Si Mixed Content persiste

**1. Vérifier les headers nginx :**
```bash
curl -I https://dev.batixpro.com | grep -i forward
# Doit contenir : X-Forwarded-Proto: https
```

**2. Vérifier la détection HTTPS dans Laravel :**
```bash
php artisan tinker
>>> request()->server('HTTP_X_FORWARDED_PROTO')
# Doit retourner : "https"
```

**3. Vérifier la génération d'URL :**
```bash
php artisan tinker
>>> url('/dashboard')
# Doit retourner : "https://dev.batixpro.com/dashboard"
# PAS : "http://dev.batixpro.com/dashboard"
```

**4. Vérifier que les assets sont les nouveaux :**
```bash
# Dans le navigateur, console :
console.log(performance.getEntriesByType('resource').find(r => r.name.includes('app-')))
# Vérifier que le timestamp est récent
```

### Si Erreur 419 persiste

**1. Vérifier le token CSRF :**
```javascript
// Dans la console navigateur :
document.querySelector('meta[name="csrf-token"]').content
```

**2. Vérifier les cookies :**
```javascript
// Dans la console navigateur :
document.cookie
// Doit contenir : XSRF-TOKEN et laravel_session avec Secure flag
```

**3. Vider complètement le cache navigateur**
- Chrome : Paramètres > Confidentialité > Effacer les données
- Cocher : Cookies, Cache, Données de site
- Période : Toutes les données

## 📊 Fichiers Modifiés

Ces fichiers ont été modifiés/créés :

1. ✅ `app/Providers/AppServiceProvider.php` - Force HTTPS
2. ✅ `app/Http/Middleware/TrustProxies.php` - Fait confiance aux proxies
3. ✅ `app/Http/Middleware/ForceHttpsInSession.php` - Corrige URLs session
4. ✅ `bootstrap/app.php` - Enregistre les middlewares
5. ✅ `resources/js/bootstrap.ts` - Intercepteur CSRF amélioré
6. ✅ `resources/js/app.tsx` - Rafraîchissement proactif token
7. ✅ `app/Http/Controllers/Auth/RedirectsUsers.php` - Redirection intelligente
8. ✅ `app/Http/Middleware/CheckScreenLock.php` - Gestion Platform Admin

## ⚙️ Configuration Nginx Requise

Votre nginx **DOIT** avoir ces headers :

```nginx
location / {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;  # ← CRITIQUE !
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}
```

## 🚀 Checklist Finale

Avant de considérer le déploiement terminé :

- [ ] `.env` vérifié avec `APP_URL=https://...`
- [ ] Script `fix_https_deploy.sh` exécuté
- [ ] PHP-FPM redémarré
- [ ] Nginx rechargé
- [ ] Cache navigateur vidé
- [ ] Test connexion → ✅ Fonctionne
- [ ] Test après inactivité → ✅ Fonctionne
- [ ] Console navigateur → ✅ Aucune erreur Mixed Content
- [ ] Test Platform Admin → ✅ Fonctionne
- [ ] Test Super Admin → ✅ Fonctionne
- [ ] Test Employé → ✅ Fonctionne

## 📞 Support

Si les problèmes persistent après avoir suivi ce guide :

1. Vérifier les logs nginx : `sudo tail -f /var/log/nginx/error.log`
2. Vérifier les logs Laravel : `tail -f storage/logs/laravel.log`
3. Vérifier la console navigateur (F12)
4. Consulter la documentation : `docs/HTTPS_MIXED_CONTENT_FIX.md`

## 📅 Date

3 mars 2026
