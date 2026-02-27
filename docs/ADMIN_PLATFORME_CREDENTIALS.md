# Identifiants Admin Plateforme - Batix SaaS

## 👑 Compte Admin Plateforme

### Informations de connexion

**Email:** `admin@batix.com`  
**Mot de passe:** `AdminBatix2026!`

### URLs d'accès

- **Page de connexion:** `http://localhost/login`
- **Dashboard plateforme:** `http://localhost/platform-admin/dashboard`

### Comment créer le compte

Exécutez les commandes suivantes dans le terminal :

```bash
# 1. Lancer les migrations (si pas encore fait)
php artisan migrate

# 2. Créer le compte admin plateforme
php artisan db:seed --class=AdminPlatformSeeder
```

### Ou via Tinker (méthode alternative)

```bash
php artisan tinker
```

Puis dans Tinker :

```php
$admin = \App\Models\User::create([
    'name' => 'Admin Plateforme',
    'email' => 'admin@batix.com',
    'password' => \Hash::make('AdminBatix2026!'),
    'role' => 'admin_platforme',
    'is_active' => true,
    'email_verified_at' => now(),
]);

echo "Compte créé ! Code User: " . $admin->code_user;
```

## 🔐 Permissions du compte

Le compte `admin_platforme` a accès à :

- ✅ **Tous les comptes** (super_admin)
- ✅ **Toutes les boutiques** (de tous les comptes)
- ✅ **Gestion des comptes** (activer/désactiver)
- ✅ **Gestion des boutiques** (activer/désactiver)
- ✅ **Dashboard plateforme** avec statistiques globales
- ✅ **Plans et abonnements** (à implémenter)
- ✅ **Tous les modules** de l'application

## 📊 Dashboard Plateforme

Une fois connecté avec ce compte, vous aurez accès à :

1. **Dashboard global** avec :
   - Nombre total de comptes
   - Nombre total de boutiques (actives/inactives)
   - Nombre total d'utilisateurs
   - Revenus mensuels

2. **Gestion des comptes** :
   - Liste de tous les comptes super_admin
   - Recherche et filtres
   - Activation/désactivation des comptes

3. **Gestion des boutiques** :
   - Liste de toutes les boutiques
   - Recherche par nom, propriétaire
   - Activation/désactivation des boutiques

## 🚨 Sécurité

- ⚠️ Ce compte a les **permissions les plus élevées** de la plateforme
- ⚠️ Ne partagez jamais ces identifiants
- ⚠️ Changez le mot de passe en production
- ⚠️ Activez l'authentification à deux facteurs (2FA) en production

## 📝 Notes

- Le `code_user` est généré automatiquement à la création du compte
- Le compte est marqué comme vérifié (`email_verified_at`) dès sa création
- Le rôle `admin_platforme` est différent de `super_admin` (plus de permissions)
