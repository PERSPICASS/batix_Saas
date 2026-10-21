# 🔗 Système de liens personnalisés - Fonctionnement complet# 🔗 Système de Liens Uniques par Compte Utilisateur



Date: 25 février 2026## ✅ Système Implémenté



## 🎯 PrincipeChaque utilisateur dispose maintenant d'un **lien unique** pour accéder à son dashboard avec sa boutique :



Chaque utilisateur a un lien unique basé sur son `code_user` et le `slug` de sa **première boutique créée**.### Format du lien :

```

**Format:** `/{code_user}/{shop_slug}/...`http://127.0.0.1:8000/dashboard/{code_user}/{shop_slug}

```

**Exemple:** `http://127.0.0.1:8000/K7FHCNRS39/ma-boutique/dashboard`

### Exemple concret :

## 📋 Flux d'authentification```

http://127.0.0.1:8000/dashboard/PDN2XYBFUS/ma-quincaillerie

### 1. Inscription (Register)```



```---

Utilisateur remplit le formulaire

  ├─ Nom, email, mot de passe## 🔧 Ce qui a été créé

  └─ Informations de la boutique (nom, adresse, etc.)

      ↓### 1. Migration

Création du compte**Fichier** : `database/migrations/xxxx_add_code_user_to_users_table.php`

  ├─ Génération automatique du code_user (8 caractères)- ✅ Ajoute le champ `code_user` (unique, 10 caractères)

  └─ Enregistrement dans la base de données- ✅ Génère automatiquement un code pour les utilisateurs existants

      ↓

Création de la première boutique### 2. Modèle User

  ├─ Génération automatique du slug**Fichier** : `app/Models/User.php`

  └─ Association utilisateur ↔ boutique- ✅ Champ `code_user` ajouté aux fillable

      ↓- ✅ Méthode `boot()` pour générer automatiquement le code à la création

Connexion automatique- ✅ Méthode `generateUniqueCode()` pour créer des codes uniques (10 caractères)

      ↓- ✅ Méthode `getDashboardUrl($shop)` pour générer le lien complet

Redirection vers: /{code_user}/{shop_slug}/dashboard

```### 3. Route

**Fichier** : `routes/web.php`

### 2. Connexion (Login)- ✅ Route `dashboard.user` : `/dashboard/{code_user}/{shop_slug}`

- ✅ Vérifie que l'utilisateur est connecté

```- ✅ Vérifie que le code_user correspond à l'utilisateur connecté

Utilisateur entre email/mot de passe- ✅ Définit la boutique active en session

      ↓- ✅ Redirige vers le dashboard

Authentification

      ↓### 4. Contrôleur d'inscription

RedirectsUsers::redirectPath()**Fichier** : `app/Http/Controllers/Auth/RegisteredUserController.php`

  ├─ Récupère l'utilisateur connecté- ✅ Redirige automatiquement vers le lien unique après inscription

  ├─ Récupère sa PREMIÈRE boutique ($user->shops()->first())- ✅ Format : `/dashboard/{code_user}/{shop_slug}`

  └─ Génère l'URL: /{code_user}/{shop_slug}/dashboard

      ↓---

Redirection automatique

```## 🚀 Fonctionnement



## 🔑 Code important### Lors de l'inscription :



### RedirectsUsers trait1. **L'utilisateur s'inscrit** avec son nom, email, mot de passe et infos boutique

```php2. **Un code unique est généré** automatiquement (ex: `PDN2XYBFUS`)

protected function redirectPath(): string3. **La boutique est créée** avec un slug (ex: `ma-quincaillerie`)

{4. **Redirection automatique** vers : `/dashboard/PDN2XYBFUS/ma-quincaillerie`

    $user = auth()->user();

    ### Lors de l'accès au lien :

    if (!$user || !$user->code_user) {

        return '/login';1. Le système **vérifie l'authentification**

    }2. Le système **trouve l'utilisateur** via le `code_user`

    3. Le système **trouve la boutique** via le `slug`

    // IMPORTANT: Récupère la PREMIÈRE boutique4. Le système **vérifie les permissions** (l'utilisateur doit être le propriétaire)

    $shop = $user->shops()->first();5. La **boutique est activée** en session

    6. **Redirection vers le dashboard** avec la boutique active

    if (!$shop || !$shop->slug) {

        return '/login';---

    }

    ## 💡 Utilisation

    return route('dashboard', [

        'code_user' => $user->code_user,### Dans le code :

        'shop_slug' => $shop->slug  // Slug de la première boutique

    ]);```php

}// Obtenir le lien pour un utilisateur

```$user = User::find(1);

$shop = $user->shops()->first();

## ✅ Tout est automatique!$url = $user->getDashboardUrl($shop);

// Résultat : http://127.0.0.1:8000/dashboard/PDN2XYBFUS/ma-quincaillerie

- ✅ Lors de l'**inscription**: redirige vers la boutique créée```

- ✅ Lors de la **connexion**: redirige vers la première boutique

- ✅ **Validation automatique** par le middleware### Dans une vue Blade :

- ✅ **Boutique active** définie en session

```blade

**C'est fait!** 🎉<a href="{{ auth()->user()->getDashboardUrl() }}">

    Mon Dashboard
</a>
```

### Dans un composant React/Inertia :

```tsx
const { user, shop } = usePage().props;
const dashboardUrl = `/dashboard/${user.code_user}/${shop.slug}`;
```

### Partager le lien :

```php
// Email, SMS, etc.
$shareableLink = $user->getDashboardUrl($shop);
// http://127.0.0.1:8000/dashboard/PDN2XYBFUS/ma-quincaillerie
```

---

## 🔒 Sécurité

### Vérifications en place :

✅ **Authentification requise** : L'utilisateur doit être connecté
✅ **Vérification du propriétaire** : Seul le propriétaire du compte peut accéder
✅ **Code unique** : Impossible de deviner le code d'un autre utilisateur
✅ **10 caractères** : Format : Lettres majuscules (sauf I, O) + chiffres (sauf 0, 1)
✅ **Unicité garantie** : Le code est vérifié en base avant création

### Format du code :

- **Longueur** : 10 caractères
- **Caractères** : `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- **Exclusions** : I, O (confusion avec 1, 0)
- **Exemple** : `PDN2XYBFUS`, `HAKR7MZ3VX`, `T9BCLWE4NP`

---

## 📊 Tests

### Test manuel :

```bash
php artisan tinker

>>> $user = App\Models\User::first();
>>> $user->code_user
=> "PDN2XYBFUS"

>>> $shop = $user->shops()->first();
>>> $shop->slug
=> "ma-quincaillerie"

>>> $user->getDashboardUrl($shop)
=> "http://localhost/dashboard/PDN2XYBFUS/ma-quincaillerie"
```

### Vérifier tous les utilisateurs :

```bash
php artisan tinker

>>> App\Models\User::all()->each(function($user) {
    echo $user->name . ' : ' . $user->code_user . PHP_EOL;
});
```

---

## 🎯 Avantages

✅ **URL claire et professionnelle** : Pas d'ID numérique visible
✅ **Facile à partager** : Lien court et mémorisable
✅ **Multi-boutique** : Un utilisateur peut avoir plusieurs boutiques avec des liens différents
✅ **Sécurisé** : Impossible de deviner les codes
✅ **Automatique** : Généré à la création du compte
✅ **Unique** : Garanti par la base de données

---

## 🔄 Migration des utilisateurs existants

La migration a automatiquement généré des codes pour tous les utilisateurs existants :

```sql
-- Vérifier les codes générés
SELECT id, name, code_user FROM users;
```

Résultat attendu :
```
| id | name       | code_user  |
|----|------------|------------|
| 1  | Jean Marc  | PDN2XYBFUS |
| 2  | Marie      | HAKR7MZ3VX |
| 3  | Pierre     | T9BCLWE4NP |
```

---

## 📝 Exemple complet

### Scénario : Nouvel utilisateur s'inscrit

1. **Inscription** :
   - Nom : "Mohammed Ali"
   - Email : "mohammed@example.com"
   - Boutique : "Quincaillerie Centre Ville"

2. **Création automatique** :
   - Code user généré : `M7HKQW3BPN`
   - Slug boutique : `quincaillerie-centre-ville`

3. **Redirection après inscription** :
   ```
   http://127.0.0.1:8000/dashboard/M7HKQW3BPN/quincaillerie-centre-ville
   ```

4. **Utilisation du lien** :
   - L'utilisateur peut bookmarquer ce lien
   - Le partager avec son équipe
   - L'utiliser comme lien direct vers sa boutique

---

## 🚨 Important

⚠️ **Le code_user est permanent et ne doit pas être modifié** une fois créé, car il pourrait être utilisé dans :
- Des bookmarks
- Des liens partagés
- Des intégrations externes
- Des emails automatiques

✅ **Régénération possible** : Si nécessaire, une commande Artisan peut être créée pour régénérer le code d'un utilisateur spécifique.

---

## 🎉 Résultat Final

Votre système dispose maintenant d'un **système de liens uniques professionnel** :

```
✅ Génération automatique de codes uniques
✅ Liens propres et partageables
✅ Redirection automatique après inscription
✅ Sécurité et vérification des permissions
✅ Support multi-boutiques
✅ Migration des utilisateurs existants effectuée
```

**Format final** : `http://127.0.0.1:8000/dashboard/{CODE_10_CHAR}/{slug-boutique}`

**Exemple réel** : `http://127.0.0.1:8000/dashboard/PDN2XYBFUS/ma-quincaillerie`
