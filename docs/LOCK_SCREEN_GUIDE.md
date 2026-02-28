# 🔒 Mode de Verrouillage d'Écran

## 📋 Vue d'Ensemble

Le mode de verrouillage d'écran permet aux utilisateurs de sécuriser rapidement leur session sans se déconnecter complètement. L'utilisateur reste authentifié mais l'interface est verrouillée et nécessite le mot de passe pour y accéder à nouveau.

## ✨ Fonctionnalités

### 🎯 Principales Caractéristiques

1. **Verrouillage Rapide** : Un clic dans le menu utilisateur
2. **Session Préservée** : L'utilisateur reste connecté, seule l'interface est verrouillée
3. **Retour Automatique** : Après déverrouillage, retour à la page où l'utilisateur était
4. **Interface Sécurisée** : Affichage du nom et email de l'utilisateur verrouillé
5. **Mot de Passe Masqué** : Possibilité d'afficher/masquer le mot de passe
6. **Option de Changement** : Lien pour se connecter avec un autre compte

### 🔐 Flux Utilisateur

```
1. Utilisateur connecté
   ↓
2. Clic sur "Verrouiller" dans menu utilisateur
   ↓
3. Redirection vers /lock-screen
   ↓
4. Écran de verrouillage affiché
   ↓
5. Saisie du mot de passe
   ↓
6. Validation
   ↓
7. Retour à la page d'origine
```

## 🏗️ Architecture

### Routes

**Fichier** : `routes/auth.php`

```php
// Lock Screen routes
Route::middleware('auth')->group(function () {
    // Afficher l'écran de verrouillage
    Route::get('lock-screen', [LockScreenController::class, 'show'])
        ->name('lock-screen.show');
    
    // Verrouiller l'écran
    Route::post('lock-screen', [LockScreenController::class, 'lock'])
        ->name('lock-screen.lock');
    
    // Déverrouiller l'écran
    Route::post('lock-screen/unlock', [LockScreenController::class, 'unlock'])
        ->name('lock-screen.unlock');
});
```

### Contrôleur

**Fichier** : `app/Http/Controllers/Auth/LockScreenController.php`

#### Méthodes

1. **`show()`** : Affiche l'écran de verrouillage
   - Vérifie que l'utilisateur est authentifié
   - Vérifie que l'écran est verrouillé
   - Passe les infos utilisateur à la vue

2. **`lock()`** : Verrouille l'écran
   - Sauvegarde l'URL actuelle en session
   - Active le flag `screen_locked`
   - Redirige vers l'écran de verrouillage

3. **`unlock()`** : Déverrouille l'écran
   - Valide le mot de passe
   - Supprime le flag de verrouillage
   - Régénère la session pour sécurité
   - Redirige vers l'URL d'origine

### Middleware

**Fichier** : `app/Http/Middleware/CheckScreenLock.php`

**Rôle** : Intercepte toutes les requêtes et redirige vers l'écran de verrouillage si nécessaire

**Logique** :
```php
if (Auth::check() && session('screen_locked')) {
    // Exception pour les routes lock-screen et logout
    if (!in_array($currentRoute, ['lock-screen.show', 'lock-screen.unlock', 'logout'])) {
        return redirect()->route('lock-screen.show');
    }
}
```

**Enregistrement** : `bootstrap/app.php`
```php
$middleware->web(append: [
    \App\Http\Middleware\CheckScreenLock::class,
]);
```

### Composant React

**Fichier** : `resources/js/Pages/Auth/LockScreen.tsx`

#### Interface

```typescript
interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    returnUrl?: string;
}
```

#### Éléments UI

1. **Icône de verrouillage** : Badge gradient avec icône Lock
2. **Avatar utilisateur** : Photo ou initiales
3. **Informations** : Nom et email
4. **Champ mot de passe** : Avec toggle afficher/masquer
5. **Bouton déverrouiller** : Gradient amber/orange
6. **Lien changement** : Se connecter avec autre compte

## 🎨 Design

### Palette de Couleurs

- **Background** : Gradient slate-900 → slate-800
- **Carte** : slate-800/50 avec backdrop-blur
- **Icône verrouillage** : Gradient amber-500 → orange-600
- **Bouton déverrouiller** : Gradient amber-500 → orange-600
- **Texte principal** : Blanc
- **Texte secondaire** : slate-400

### Effets Visuels

- ✨ Backdrop blur sur la carte
- 🎭 Shadow colorés (amber-500/30)
- 🔄 Transitions douces
- 📱 Design responsive

## 🔧 Intégration

### Dans le Menu Utilisateur

**Fichier** : `resources/js/Layouts/AuthenticatedLayout.tsx`

```tsx
<Link
    href={route('lock-screen.lock')}
    method="post"
    as="button"
    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-amber-500 transition hover:bg-amber-500/10"
>
    <Lock className="size-4" />
    <span>Verrouiller</span>
</Link>
```

**Position** : Entre "Paramètres" et "Déconnexion"

### Session Data

Données stockées en session lors du verrouillage :

```php
session([
    'screen_locked' => true,              // Flag de verrouillage
    'lock_screen_return_url' => $url,     // URL de retour
    'locked_at' => now(),                 // Timestamp du verrouillage
]);
```

## 🧪 Tests Manuels

### Test 1 : Verrouillage Basique

1. ✅ Se connecter avec un compte
2. ✅ Naviguer vers une page (ex: Dashboard)
3. ✅ Cliquer sur menu utilisateur
4. ✅ Cliquer sur "Verrouiller"
5. ✅ **Attendu** : Redirection vers `/lock-screen`
6. ✅ **Attendu** : Affichage nom, email, avatar
7. ✅ Entrer le mot de passe correct
8. ✅ Cliquer sur "Déverrouiller"
9. ✅ **Attendu** : Retour sur la page Dashboard

### Test 2 : Mauvais Mot de Passe

1. ✅ Verrouiller l'écran
2. ✅ Entrer un mot de passe incorrect
3. ✅ **Attendu** : Message d'erreur "Le mot de passe est incorrect"
4. ✅ **Attendu** : Rester sur l'écran de verrouillage

### Test 3 : Navigation Bloquée

1. ✅ Verrouiller l'écran
2. ✅ Tenter d'accéder à `/dashboard` via URL
3. ✅ **Attendu** : Redirection automatique vers `/lock-screen`

### Test 4 : Changement de Compte

1. ✅ Verrouiller l'écran
2. ✅ Cliquer sur "Se connecter avec un autre compte"
3. ✅ **Attendu** : Déconnexion complète
4. ✅ **Attendu** : Redirection vers `/login`

### Test 5 : Toggle Mot de Passe

1. ✅ Sur l'écran de verrouillage
2. ✅ Saisir un mot de passe
3. ✅ Cliquer sur icône œil
4. ✅ **Attendu** : Mot de passe visible en clair
5. ✅ Cliquer à nouveau
6. ✅ **Attendu** : Mot de passe masqué

### Test 6 : Admin Plateforme

1. ✅ Se connecter en tant qu'admin_platforme
2. ✅ Verrouiller l'écran
3. ✅ Déverrouiller avec le bon mot de passe
4. ✅ **Attendu** : Retour sur `/platform/dashboard`

### Test 7 : Tous les Rôles

- ✅ **super_admin** : Verrouillage → Retour sur `/{code_user}/dashboard`
- ✅ **manager** : Verrouillage → Retour sur la même page
- ✅ **employee** : Verrouillage → Retour sur la même page
- ✅ **admin_platforme** : Verrouillage → Retour sur `/platform/dashboard`

## 🚀 Améliorations Futures (Optionnelles)

### 1. Auto-Lock après Inactivité

```typescript
// Hook React pour détecter l'inactivité
useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            router.post(route('lock-screen.lock'));
        }, 15 * 60 * 1000); // 15 minutes
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    
    return () => {
        clearTimeout(timeout);
        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keydown', resetTimer);
    };
}, []);
```

### 2. Raccourci Clavier

```typescript
// Ctrl+Alt+L pour verrouiller
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.altKey && e.key === 'l') {
            e.preventDefault();
            router.post(route('lock-screen.lock'));
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### 3. Paramètre Utilisateur

Ajouter dans les paramètres :
- ✅ Activer/désactiver le verrouillage automatique
- ✅ Durée d'inactivité avant verrouillage (5, 10, 15, 30 min)
- ✅ Activer/désactiver le raccourci clavier

### 4. Historique des Verrouillages

Table `screen_locks` :
```php
Schema::create('screen_locks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->timestamp('locked_at');
    $table->timestamp('unlocked_at')->nullable();
    $table->string('ip_address');
    $table->string('user_agent');
});
```

## 📊 Sécurité

### Points de Sécurité

1. ✅ **Mot de passe requis** : Pas de déverrouillage sans mot de passe
2. ✅ **Session régénérée** : Après déverrouillage pour éviter la fixation de session
3. ✅ **Middleware global** : Toutes les routes protégées automatiquement
4. ✅ **Validation serveur** : Vérification du mot de passe côté backend
5. ✅ **Logout option** : Possibilité de se déconnecter complètement

### Limitations

- ⚠️ **Pas de throttling** : Ajouter une limite de tentatives si nécessaire
- ⚠️ **Pas de 2FA** : Le 2FA n'est pas redemandé au déverrouillage
- ⚠️ **Session expiration** : Si la session expire, l'utilisateur est déconnecté

## 📝 Notes Techniques

### Différence avec Logout

| Fonctionnalité | Lock Screen | Logout |
|----------------|-------------|--------|
| Session | ✅ Préservée | ❌ Détruite |
| Authentification | ✅ Maintenue | ❌ Perdue |
| Retour page | ✅ Automatique | ❌ Login required |
| Données session | ✅ Conservées | ❌ Effacées |
| Boutique active | ✅ Maintenue | ❌ Perdue |

### Avantages

1. 🚀 **Rapidité** : Pas besoin de se reconnecter complètement
2. 🔒 **Sécurité** : Protège contre accès physique non autorisé
3. 💾 **Contexte** : Garde tout le contexte de travail (boutique, filtres, etc.)
4. 👥 **Multi-users** : Utile dans environnements partagés (caisse, bureau)
5. ⚡ **UX** : Meilleure expérience utilisateur

## 🔄 Fichiers Créés/Modifiés

### Créés

1. ✅ `resources/js/Pages/Auth/LockScreen.tsx` - Interface de verrouillage
2. ✅ `app/Http/Controllers/Auth/LockScreenController.php` - Logique backend
3. ✅ `app/Http/Middleware/CheckScreenLock.php` - Middleware de vérification
4. ✅ `docs/LOCK_SCREEN_GUIDE.md` - Cette documentation

### Modifiés

1. ✅ `routes/auth.php` - Ajout des 3 routes lock-screen
2. ✅ `bootstrap/app.php` - Enregistrement du middleware
3. ✅ `resources/js/Layouts/AuthenticatedLayout.tsx` - Ajout bouton "Verrouiller"

## 📅 Date d'Implémentation

28 février 2026

## ✅ Statut

🎉 **IMPLÉMENTÉ** - Le mode de verrouillage d'écran est pleinement fonctionnel.

---

## 🎯 Utilisation Rapide

### Pour Verrouiller

```typescript
// Via le menu utilisateur
<Link href={route('lock-screen.lock')} method="post">
    Verrouiller
</Link>

// Ou programmatiquement
router.post(route('lock-screen.lock'));
```

### Pour Vérifier l'État

```php
// Côté serveur
if (session('screen_locked')) {
    // L'écran est verrouillé
}
```

```typescript
// Côté client (via Inertia props si nécessaire)
const isLocked = usePage().props.screenLocked;
```
