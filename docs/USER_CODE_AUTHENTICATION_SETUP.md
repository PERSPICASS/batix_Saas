# Configuration de l'Authentification avec code_user

## Vue d'ensemble

Ce document décrit le système d'authentification personnalisé mis en place pour rediriger les utilisateurs vers des URLs uniques basées sur leur `code_user` et le `slug` de leur boutique.

## Format de l'URL personnalisée

```
/dashboard/{code_user}/{shop_slug}
```

**Exemple:**
```
http://127.0.0.1:8000/dashboard/ABC12345/ma-boutique
```

## Composants mis en place

### 1. Migration - Champ code_user

**Fichier:** `database/migrations/*_add_code_user_to_users_table.php`

Ajoute le champ `code_user` à la table `users`:
- Type: `string` (8 caractères)
- Unique et indexé
- Généré automatiquement lors de la création d'un utilisateur

### 2. Modèle User

**Fichier:** `app/Models/User.php`

**Modifications:**
- Ajout de `code_user` dans le tableau `$fillable`
- Méthode `boot()` qui génère automatiquement un code unique à la création
- Méthode `generateUniqueCode()` pour créer un code alphanumerique de 8 caractères

```php
protected static function boot()
{
    parent::boot();
    
    static::creating(function ($user) {
        if (empty($user->code_user)) {
            $user->code_user = self::generateUniqueCode();
        }
    });
}
```

### 3. Trait RedirectsUsers

**Fichier:** `app/Http/Controllers/Auth/RedirectsUsers.php`

Centralise la logique de redirection après authentification:

```php
public function redirectPath(): string
{
    $user = auth()->user();
    
    if ($user && $user->code_user) {
        $shop = $user->shops()->first();
        
        if ($shop && $shop->slug) {
            return route('dashboard.user', [
                'code_user' => $user->code_user,
                'shop_slug' => $shop->slug
            ]);
        }
    }
    
    return route('dashboard');
}
```

### 4. Contrôleurs Auth mis à jour

Tous les contrôleurs d'authentification utilisent maintenant le trait `RedirectsUsers`:

#### 4.1 AuthenticatedSessionController
**Fichier:** `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
- **Action:** Connexion de l'utilisateur
- **Redirection:** Vers `/dashboard/{code_user}/{shop_slug}` après connexion

#### 4.2 RegisteredUserController
**Fichier:** `app/Http/Controllers/Auth/RegisteredUserController.php`
- **Action:** Inscription d'un nouvel utilisateur
- **Redirection:** Vers `/dashboard/{code_user}/{shop_slug}` après inscription

#### 4.3 ConfirmablePasswordController
**Fichier:** `app/Http/Controllers/Auth/ConfirmablePasswordController.php`
- **Action:** Confirmation du mot de passe
- **Redirection:** Vers `/dashboard/{code_user}/{shop_slug}` après confirmation

#### 4.4 EmailVerificationPromptController
**Fichier:** `app/Http/Controllers/Auth/EmailVerificationPromptController.php`
- **Action:** Vérification d'email (déjà vérifié)
- **Redirection:** Vers `/dashboard/{code_user}/{shop_slug}` si déjà vérifié

#### 4.5 VerifyEmailController
**Fichier:** `app/Http/Controllers/Auth/VerifyEmailController.php`
- **Action:** Vérification de l'email
- **Redirection:** Vers `/dashboard/{code_user}/{shop_slug}?verified=1` après vérification

#### 4.6 EmailVerificationNotificationController
**Fichier:** `app/Http/Controllers/Auth/EmailVerificationNotificationController.php`
- **Action:** Envoi de notification de vérification d'email
- **Redirection:** Vers `/dashboard/{code_user}/{shop_slug}` si déjà vérifié

### 5. InvitationController

**Fichier:** `app/Http/Controllers/InvitationController.php`
- **Action:** Acceptation d'invitation
- **Redirection:** Vers `/dashboard/{code_user}/{shop_slug}` après acceptation

### 6. Route dashboard.user

**Fichier:** `routes/web.php`

```php
Route::get('/dashboard/{code_user}/{shop_slug}', function ($codeUser, $shopSlug) {
    $user = \App\Models\User::where('code_user', $codeUser)->firstOrFail();
    $shop = $user->shops()->where('slug', $shopSlug)->firstOrFail();
    
    // Vérifications de sécurité
    if (!auth()->check()) {
        return redirect()->route('login')
            ->with('info', 'Veuillez vous connecter pour accéder à votre tableau de bord.');
    }
    
    if (auth()->id() !== $user->id) {
        return redirect()->route('dashboard')
            ->with('error', 'Accès non autorisé.');
    }
    
    // Définir la boutique active en session
    session(['active_shop_id' => $shop->id]);
    
    return redirect()->route('dashboard')
        ->with('success', "Bienvenue dans {$shop->name} !");
})->name('dashboard.user');
```

## Sécurité

La route `dashboard.user` implémente plusieurs vérifications:

1. **Authentification:** Vérifie que l'utilisateur est connecté
2. **Autorisation:** Vérifie que le `code_user` correspond à l'utilisateur connecté
3. **Existence:** Vérifie que l'utilisateur et la boutique existent (via `firstOrFail()`)
4. **Propriété:** Vérifie que la boutique appartient bien à l'utilisateur

## Flux d'authentification

### 1. Inscription (Register)
```
Utilisateur remplit le formulaire
    ↓
Création du compte (code_user généré automatiquement)
    ↓
Création de la première boutique
    ↓
Connexion automatique
    ↓
Redirection vers /dashboard/{code_user}/{shop_slug}
    ↓
Définition de la boutique active en session
    ↓
Redirection finale vers /dashboard
```

### 2. Connexion (Login)
```
Utilisateur entre email/mot de passe
    ↓
Authentification
    ↓
Redirection vers /dashboard/{code_user}/{shop_slug}
    ↓
Définition de la boutique active en session
    ↓
Redirection finale vers /dashboard
```

### 3. Acceptation d'invitation
```
Utilisateur clique sur le lien d'invitation
    ↓
Définition du mot de passe
    ↓
Acceptation de l'invitation
    ↓
Connexion automatique
    ↓
Redirection vers /dashboard/{code_user}/{shop_slug}
    ↓
Définition de la boutique active en session
    ↓
Redirection finale vers /dashboard
```

## Tests

Pour tester le système:

### 1. Vérifier les codes existants
```bash
php artisan tinker
```
```php
\App\Models\User::all(['id', 'name', 'email', 'code_user']);
```

### 2. Tester la génération de code
```php
$user = \App\Models\User::factory()->create();
echo $user->code_user; // Devrait afficher un code de 8 caractères
```

### 3. Tester la route
```bash
# Remplacer ABC12345 par un vrai code_user et ma-boutique par un vrai slug
curl http://127.0.0.1:8000/dashboard/ABC12345/ma-boutique
```

### 4. Tester l'inscription
1. Déconnectez-vous si connecté
2. Allez sur `/register`
3. Créez un nouveau compte
4. Vérifiez que vous êtes redirigé vers l'URL personnalisée

### 5. Tester la connexion
1. Déconnectez-vous
2. Allez sur `/login`
3. Connectez-vous
4. Vérifiez que vous êtes redirigé vers l'URL personnalisée

## Améliorations futures possibles

1. **Middleware de validation:** Créer un middleware dédié pour valider le `code_user`
2. **Partage de lien:** Permettre aux utilisateurs de partager leur lien personnalisé
3. **Analytics:** Tracker les accès via les liens personnalisés
4. **Personnalisation:** Permettre aux utilisateurs de personnaliser leur `code_user`
5. **Multi-shops:** Gérer facilement le passage entre plusieurs boutiques via l'URL

## Fichiers modifiés

- ✅ `app/Models/User.php`
- ✅ `app/Http/Controllers/Auth/RedirectsUsers.php` (créé)
- ✅ `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
- ✅ `app/Http/Controllers/Auth/RegisteredUserController.php`
- ✅ `app/Http/Controllers/Auth/ConfirmablePasswordController.php`
- ✅ `app/Http/Controllers/Auth/EmailVerificationPromptController.php`
- ✅ `app/Http/Controllers/Auth/VerifyEmailController.php`
- ✅ `app/Http/Controllers/Auth/EmailVerificationNotificationController.php`
- ✅ `app/Http/Controllers/InvitationController.php`
- ✅ `database/migrations/*_add_code_user_to_users_table.php`
- ✅ `routes/web.php`

## Commandes utiles

### Mettre à jour les utilisateurs existants
```bash
php artisan tinker
```
```php
\App\Models\User::whereNull('code_user')->get()->each(function($user) {
    $user->code_user = \App\Models\User::generateUniqueCode();
    $user->save();
});
```

### Régénérer un code pour un utilisateur spécifique
```php
$user = \App\Models\User::find(1);
$user->code_user = \App\Models\User::generateUniqueCode();
$user->save();
```

### Trouver un utilisateur par code_user
```php
$user = \App\Models\User::where('code_user', 'ABC12345')->first();
```
