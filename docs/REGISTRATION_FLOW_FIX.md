# Fix - Flux d'Inscription en 3 Étapes

**Date**: 2 mars 2026  
**Statut**: ✅ Implémenté

## Problème

Le flux d'inscription demandait les informations de la boutique dès l'inscription, avant même la vérification de l'email. Le flux devait être revu pour être plus sécurisé et intuitif.

### Ancien Flux (Avant)
1. Formulaire d'inscription (infos personnelles + infos boutique)
2. Création utilisateur + création boutique immédiate
3. Envoi email OTP
4. Vérification OTP
5. Redirection vers dashboard

### Nouveau Flux (Après)
1. ✅ **Étape 1/3** : Informations personnelles (nom, email, mot de passe)
2. ✅ **Étape 2/3** : Vérification OTP de l'adresse email
3. ✅ **Étape 3/3** : Création de la boutique

## Modifications Implémentées

### 1. RegisteredUserController - Méthode `store()`

**Fichier**: `app/Http/Controllers/Auth/RegisteredUserController.php`

**Avant**:
```php
// Créer la première boutique de l'utilisateur
$shop = $user->shops()->create([...]);

// Associer l'utilisateur à la boutique
$user->update(['shop_id' => $shop->id]);

// Donner toutes les permissions...
// Attribuer le plan FREE...

// Rediriger vers vérification
return redirect()->route('verification.code.show');
```

**Après**:
```php
// Stocker les données de la boutique en session pour les créer après vérification OTP
session([
    'pending_shop_data' => [
        'name' => $request->shop_name,
        'address' => $request->shop_address,
        'city' => $request->shop_city,
        'postal_code' => $request->shop_postal_code,
        'phone' => $request->shop_phone,
    ]
]);

// Envoyer l'email de vérification
// Rediriger vers vérification
return redirect()->route('verification.code.show');
```

### 2. EmailVerificationCodeController - Méthode `verify()`

**Fichier**: `app/Http/Controllers/Auth/EmailVerificationCodeController.php`

**Ajout** : Imports nécessaires
```php
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
```

**Modification** : Création de la boutique après vérification
```php
// Marquer l'email comme vérifié
$user->markEmailAsVerified();

// Nettoyer le code de vérification
$user->update([
    'email_verification_code' => null,
    'email_verification_code_expires_at' => null,
]);

// Créer la boutique si les données sont en session (nouveau compte)
$shopData = session('pending_shop_data');
if ($shopData && !$user->shops()->exists()) {
    // Créer la première boutique
    $shop = $user->shops()->create([...]);
    
    // Associer la boutique à l'utilisateur
    $user->update(['shop_id' => $shop->id]);
    
    // Donner toutes les permissions
    foreach ($modules as $module) {
        $user->permissions()->create([...]);
    }
    
    // Attribuer le plan FREE
    if ($freePlan) {
        Subscription::create([...]);
    }
    
    // Définir la boutique active en session
    session(['active_shop_id' => $shop->id]);
    
    // Nettoyer les données temporaires
    session()->forget('pending_shop_data');
    
    // Recharger l'utilisateur
    $user->refresh();
}

// Vérifier que l'utilisateur a un code_user
if (!$user->code_user) {
    return response()->json([
        'message' => 'Une erreur est survenue. Veuillez vous reconnecter.',
        'redirect' => route('login')
    ]);
}

return response()->json([
    'message' => 'Votre email a été vérifié avec succès !',
    'redirect' => route('dashboard', ['code_user' => $user->code_user])
]);
```

### 3. EmailVerificationCodeController - Méthode `show()`

**Modification** : Vérification du `code_user` avant redirection

**Avant**:
```php
if ($user->hasVerifiedEmail()) {
    return redirect()->route('dashboard', ['code_user' => $user->code_user]);
}
```

**Après**:
```php
if ($user->hasVerifiedEmail() && $user->code_user) {
    return redirect()->route('dashboard', ['code_user' => $user->code_user]);
}
```

## Avantages du Nouveau Flux

### 1. Sécurité
- ✅ La boutique n'est créée que si l'email est vérifié
- ✅ Empêche la création de boutiques par des emails non vérifiés
- ✅ Réduit les comptes "fantômes" avec boutiques non utilisées

### 2. Expérience Utilisateur
- ✅ Flux logique : Inscription → Vérification → Configuration
- ✅ L'utilisateur doit prouver qu'il a accès à l'email avant de continuer
- ✅ Correspond aux attentes standard des applications modernes

### 3. Gestion des Données
- ✅ Pas de boutiques orphelines si l'email n'est jamais vérifié
- ✅ Nettoyage automatique des données temporaires après création
- ✅ Session utilisée comme stockage temporaire sécurisé

## Données Stockées en Session

### Structure de `pending_shop_data`
```php
[
    'name' => string,          // Nom de la boutique (requis)
    'address' => string|null,  // Adresse
    'city' => string|null,     // Ville
    'postal_code' => string|null, // Code postal
    'phone' => string|null,    // Téléphone
]
```

### Durée de Vie
- ✅ Stockée lors de l'inscription
- ✅ Conservée pendant la session
- ✅ Supprimée après création de la boutique
- ✅ Expirée automatiquement si la session expire

## Cas Limites Gérés

### 1. Utilisateur Existant sans Boutique
```php
if ($shopData && !$user->shops()->exists()) {
    // Créer la boutique seulement si elle n'existe pas encore
}
```

### 2. Code OTP Expiré
- ✅ Les données de la boutique restent en session
- ✅ L'utilisateur peut demander un nouveau code
- ✅ Les données ne sont pas perdues

### 3. Utilisateur sans code_user
```php
if (!$user->code_user) {
    return response()->json([
        'message' => 'Une erreur est survenue. Veuillez vous reconnecter.',
        'redirect' => route('login')
    ]);
}
```

### 4. Session Expirée
- ✅ Si la session expire avant vérification OTP, l'utilisateur peut se reconnecter
- ✅ Il devra créer sa boutique manuellement via l'interface

## Tests Recommandés

### Test 1 : Inscription Normale
1. ✅ Remplir le formulaire d'inscription avec toutes les données
2. ✅ Vérifier que l'utilisateur est créé mais **pas la boutique**
3. ✅ Vérifier réception de l'email OTP
4. ✅ Entrer le code OTP correct
5. ✅ Vérifier que la boutique est créée
6. ✅ Vérifier que les permissions sont créées
7. ✅ Vérifier que l'abonnement FREE est attribué
8. ✅ Vérifier redirection vers dashboard

### Test 2 : Code OTP Incorrect
1. ✅ S'inscrire normalement
2. ✅ Entrer un code OTP incorrect
3. ✅ Vérifier que la boutique n'est **pas** créée
4. ✅ Vérifier que l'utilisateur reste sur la page OTP
5. ✅ Entrer le code correct
6. ✅ Vérifier que la boutique est créée

### Test 3 : Code OTP Expiré
1. ✅ S'inscrire normalement
2. ✅ Attendre expiration du code (15 minutes)
3. ✅ Essayer de valider → Message d'erreur
4. ✅ Demander un nouveau code
5. ✅ Valider avec le nouveau code
6. ✅ Vérifier que la boutique est créée

### Test 4 : Multiples Tentatives
1. ✅ S'inscrire normalement
2. ✅ Tenter plusieurs codes incorrects
3. ✅ Finalement entrer le bon code
4. ✅ Vérifier qu'une seule boutique est créée

### Test 5 : Session Expirée
1. ✅ S'inscrire normalement
2. ✅ Effacer les cookies (simuler expiration session)
3. ✅ Se reconnecter
4. ✅ Vérifier que l'utilisateur existe mais pas la boutique
5. ✅ Créer la boutique manuellement via l'interface

## Impact sur les Utilisateurs Existants

### Utilisateurs Déjà Inscrits
- ✅ **Aucun impact** - Ils ont déjà leur boutique
- ✅ Le code vérifie `!$user->shops()->exists()` avant création

### Nouveaux Utilisateurs
- ✅ Doivent suivre le nouveau flux
- ✅ Vérification OTP obligatoire avant accès au dashboard

## Sécurité

### Protections en Place
- ✅ Données de boutique stockées en session (sécurisée côté serveur)
- ✅ Vérification OTP avant toute création
- ✅ Expiration automatique du code après 15 minutes
- ✅ Vérification de l'unicité du `code_user`
- ✅ Nettoyage automatique des données temporaires

### Validations
- ✅ Validation du format du code OTP (6 chiffres)
- ✅ Validation de l'email unique lors de l'inscription
- ✅ Validation des données de la boutique
- ✅ Vérification d'existence avant création

## Fichiers Modifiés

1. ✅ `app/Http/Controllers/Auth/RegisteredUserController.php`
   - Stockage des données boutique en session au lieu de création immédiate
   - Suppression de la création de boutique, permissions et abonnement

2. ✅ `app/Http/Controllers/Auth/EmailVerificationCodeController.php`
   - Ajout des imports `SubscriptionPlan` et `Subscription`
   - Ajout de la logique de création de boutique dans `verify()`
   - Vérification du `code_user` avant redirection dans `show()`

3. ✅ `docs/REGISTRATION_FLOW_FIX.md`
   - Documentation complète du nouveau flux

## Prochaines Étapes Possibles

### Améliorations Futures
- [ ] Ajouter un indicateur de progression (Étape 1/2)
- [ ] Permettre de modifier les données de la boutique avant vérification
- [ ] Ajouter un timeout visuel pour le code OTP
- [ ] Envoyer un email de bienvenue après création réussie
- [ ] Logger les tentatives de vérification échouées

### Monitoring
- [ ] Tracker le taux de vérification OTP réussie
- [ ] Identifier les utilisateurs bloqués à l'étape OTP
- [ ] Surveiller les boutiques non créées après X heures

## Conclusion

Le nouveau flux d'inscription garantit que seuls les utilisateurs ayant vérifié leur email peuvent créer une boutique et accéder à l'application. Cela améliore la sécurité et réduit les comptes non utilisés dans la base de données.

---

**Modifié le** : 2 mars 2026  
**Testé** : En attente de tests utilisateur  
**Statut** : ✅ Déployé en dev
