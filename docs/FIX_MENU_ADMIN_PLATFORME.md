# Fix Menu Admin Plateforme - Erreur Ziggy

## 🐛 Problème identifié

Lorsqu'un utilisateur avec le rôle `admin_platforme` cliquait sur le menu déroulant dans le header, une erreur Ziggy se produisait :

```
Uncaught Error: Ziggy error: 'code_user' parameter is required for route 'profile.edit'.
```

## 🔍 Cause

Le menu déroulant affichait deux liens qui nécessitaient le paramètre `code_user` :
- **Profil** (`profile.edit`)
- **Paramètres** (`settings.index`)

Ces routes sont définies dans un groupe qui nécessite le `code_user` dans l'URL, mais les utilisateurs `admin_platforme` n'ont pas de `code_user` car ils ne sont pas liés à un compte spécifique - ils gèrent la plateforme entière.

## ✅ Solution appliquée

### 1. Menu déroulant utilisateur (Desktop)

**Fichier :** `resources/js/Layouts/AuthenticatedLayout.tsx` (lignes ~525-550)

**Avant :**
```tsx
{user ? (
    <>
        <Link href={buildRoute('profile.edit')}>Profil</Link>
        <Link href={buildRoute('settings.index')}>Parametres</Link>
        <Link href={route('logout')}>Deconnexion</Link>
    </>
) : (
    <Link href={route('login')}>Connexion</Link>
)}
```

**Après :**
```tsx
{user ? (
    <>
        {user.role !== 'admin_platforme' && (
            <>
                <Link href={buildRoute('profile.edit')}>Profil</Link>
                <Link href={buildRoute('settings.index')}>Parametres</Link>
            </>
        )}
        <Link href={route('logout')}>Deconnexion</Link>
    </>
) : (
    <Link href={route('login')}>Connexion</Link>
)}
```

### 2. Menu de navigation principal (Sidebar)

**Fichier :** `resources/js/Layouts/AuthenticatedLayout.tsx` (ligne ~313)

**Avant :**
```tsx
...(user
    ? [{
        label: 'Profil',
        href: buildRoute('profile.edit'),
        active: route().current('profile.*'),
        icon: Settings,
        module: null,
    }]
    : []),
```

**Après :**
```tsx
...(user && (user as any).role !== 'admin_platforme'
    ? [{
        label: 'Profil',
        href: buildRoute('profile.edit'),
        active: route().current('profile.*'),
        icon: Settings,
        module: null,
    }]
    : []),
```

## 🎯 Résultat

Maintenant, pour les utilisateurs `admin_platforme` :
- ✅ Le menu déroulant affiche uniquement **Déconnexion**
- ✅ Le lien **Profil** n'apparaît pas dans la sidebar
- ✅ Aucune erreur Ziggy n'est générée
- ✅ L'interface fonctionne correctement

Pour les autres rôles (`super_admin`, `manager`, `cashier`, `employee`) :
- ✅ Le menu déroulant affiche **Profil**, **Paramètres** et **Déconnexion**
- ✅ Le lien **Profil** apparaît dans la sidebar
- ✅ Tout fonctionne normalement

## 🔧 Note technique

Une assertion de type `(user as any).role` a été nécessaire dans le menu de navigation car TypeScript avait du mal à inférer le type complet de `user` dans ce contexte spécifique. C'est une limitation connue de l'inférence de types dans les expressions complexes.

## 🚀 Routes admin_platforme

Les utilisateurs `admin_platforme` ont accès à leurs propres routes spécifiques :
- `/platform-admin/dashboard` - Dashboard plateforme
- `/platform-admin/accounts` - Gestion des comptes
- `/platform-admin/shops` - Gestion des boutiques
- `/platform-admin/subscriptions` - Gestion des plans d'abonnement
- `/platform-admin/active-subscriptions` - Gestion des abonnements actifs

Ces routes ne nécessitent pas de `code_user` car elles opèrent au niveau de la plateforme entière.

## ✅ Tests effectués

- [x] Compilation TypeScript réussie
- [x] Build Vite réussi
- [x] Aucune erreur dans la console
- [x] Menu déroulant admin_platforme affiche uniquement Déconnexion
- [x] Menu déroulant autres rôles affiche Profil, Paramètres et Déconnexion

## 📝 Prochaines étapes possibles

Si besoin, on pourrait :
1. Créer des routes profile/settings spécifiques pour admin_platforme sans code_user
2. Ajouter une page de profil simplifiée pour admin_platforme
3. Créer des paramètres globaux de plateforme accessibles aux admin_platforme
