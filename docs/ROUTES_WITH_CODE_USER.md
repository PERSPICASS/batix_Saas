# Système de Routes avec code_user et shop_slug

## Vue d'ensemble

Toutes les routes authentifiées de l'application utilisent maintenant un préfixe personnalisé basé sur le `code_user` de l'utilisateur et le `slug` de la boutique active.

## Format des URLs

```
/{code_user}/{shop_slug}/...
```

**Exemples:**
```
http://127.0.0.1:8000/ABC12345/ma-boutique/dashboard
http://127.0.0.1:8000/ABC12345/ma-boutique/produits
http://127.0.0.1:8000/ABC12345/ma-boutique/clients
http://127.0.0.1:8000/ABC12345/ma-boutique/factures
```

## Architecture

### 1. Structure des routes (routes/web.php)

```php
Route::middleware('auth')->group(function () {
    Route::prefix('{code_user}/{shop_slug}')
        ->middleware(\App\Http\Middleware\ValidateUserShopAccess::class)
        ->group(function () {
            
            // Toutes vos routes ici
            Route::get('/dashboard', ...)->name('dashboard');
            Route::resource('produits', ProductController::class)->names('products');
            // etc.
        });
});
```

### 2. Middleware ValidateUserShopAccess

**Fichier:** `app/Http/Middleware/ValidateUserShopAccess.php`

Ce middleware:
- ✅ Valide que le `code_user` existe
- ✅ Valide que le `shop_slug` existe
- ✅ Vérifie que l'utilisateur connecté correspond au `code_user`
- ✅ Vérifie que la boutique appartient à l'utilisateur
- ✅ Définit automatiquement la boutique active en session
- ✅ Partage les données avec la requête

### 3. Helpers globaux

**Fichier:** `app/Helpers/RouteHelper.php`

#### `user_route($name, $parameters = [], $absolute = true)`

Génère une URL avec les paramètres `code_user` et `shop_slug` automatiquement:

```php
// Dans un contrôleur
return redirect(user_route('products.index'));
// Résultat: /ABC12345/ma-boutique/produits

return redirect(user_route('products.show', ['product' => $product->id]));
// Résultat: /ABC12345/ma-boutique/produits/123
```

#### `current_shop()`

Retourne la boutique actuellement active:

```php
$shop = current_shop();
echo $shop->name; // "Ma Boutique"
```

#### `user_code()`

Retourne le code_user de l'utilisateur connecté:

```php
$code = user_code();
echo $code; // "ABC12345"
```

#### `shop_slug()`

Retourne le slug de la boutique active:

```php
$slug = shop_slug();
echo $slug; // "ma-boutique"
```

### 4. Partage automatique avec Inertia

**Fichier:** `app/Http/Middleware/HandleInertiaRequests.php`

Données partagées automatiquement avec toutes les pages React:

```typescript
interface SharedProps {
    auth: {
        user: User | null;
        code_user: string | null;
    };
    currentShop: {
        id: number;
        name: string;
        slug: string;
    } | null;
    routeParams: {
        code_user: string | null;
        shop_slug: string | null;
    };
    // ... autres données
}
```

### 5. Utilisation dans React/TypeScript

#### Accéder aux paramètres de route

```tsx
import { usePage } from '@inertiajs/react';

function MyComponent() {
    const { routeParams } = usePage().props;
    
    console.log(routeParams.code_user); // "ABC12345"
    console.log(routeParams.shop_slug); // "ma-boutique"
    
    return <div>...</div>;
}
```

#### Générer des liens avec Inertia

```tsx
import { Link } from '@inertiajs/react';

// Méthode 1: Utiliser route() avec les paramètres automatiques
<Link href={route('products.index', { 
    code_user: routeParams.code_user, 
    shop_slug: routeParams.shop_slug 
})}>
    Produits
</Link>

// Méthode 2: Créer un helper personnalisé
function userRoute(name: string, params = {}) {
    const { routeParams } = usePage().props;
    return route(name, {
        code_user: routeParams.code_user,
        shop_slug: routeParams.shop_slug,
        ...params
    });
}

<Link href={userRoute('products.show', { product: 123 })}>
    Voir le produit
</Link>
```

## Liste des routes affectées

Toutes les routes suivantes utilisent maintenant le préfixe `/{code_user}/{shop_slug}`:

### Routes principales
- ✅ `/dashboard` → `/{code_user}/{shop_slug}/dashboard`
- ✅ `/profile` → `/{code_user}/{shop_slug}/profile`
- ✅ `/parametres` → `/{code_user}/{shop_slug}/parametres`

### Routes ressources
- ✅ `/boutiques/*` → `/{code_user}/{shop_slug}/boutiques/*`
- ✅ `/produits/*` → `/{code_user}/{shop_slug}/produits/*`
- ✅ `/categories/*` → `/{code_user}/{shop_slug}/categories/*`
- ✅ `/sous-categories/*` → `/{code_user}/{shop_slug}/sous-categories/*`
- ✅ `/clients/*` → `/{code_user}/{shop_slug}/clients/*`
- ✅ `/factures/*` → `/{code_user}/{shop_slug}/factures/*`
- ✅ `/ventes/*` → `/{code_user}/{shop_slug}/ventes/*`
- ✅ `/stocks/*` → `/{code_user}/{shop_slug}/stocks/*`
- ✅ `/inventory/*` → `/{code_user}/{shop_slug}/inventory/*`
- ✅ `/users/*` → `/{code_user}/{shop_slug}/users/*`
- ✅ `/suppliers/*` → `/{code_user}/{shop_slug}/suppliers/*`
- ✅ `/abonnements` → `/{code_user}/{shop_slug}/abonnements`
- ✅ `/analitics` → `/{code_user}/{shop_slug}/analitics`

## Redirection après authentification

**Fichier:** `app/Http/Controllers/Auth/RedirectsUsers.php`

Après connexion/inscription, l'utilisateur est automatiquement redirigé vers:
```
/{code_user}/{shop_slug}/dashboard
```

## Sécurité

### Vérifications automatiques

1. **Authentification:** Middleware `auth` requis
2. **Propriété:** Le `code_user` doit correspondre à l'utilisateur connecté
3. **Accès boutique:** La boutique doit appartenir à l'utilisateur
4. **Existence:** 404 si `code_user` ou `shop_slug` invalides
5. **Autorisation:** 403 si tentative d'accès au compte d'un autre utilisateur

### Exemple de validation

```php
// Dans ValidateUserShopAccess middleware

// Vérifier l'utilisateur
$user = User::where('code_user', $codeUser)->first();
if (!$user) {
    abort(404, 'Utilisateur non trouvé');
}

// Vérifier l'autorisation
if (auth()->id() !== $user->id) {
    abort(403, 'Accès non autorisé');
}

// Vérifier la boutique
$shop = $user->shops()->where('slug', $shopSlug)->first();
if (!$shop) {
    abort(404, 'Boutique non trouvée');
}
```

## Migration depuis l'ancien système

### Avant (routes sans préfixe)
```php
Route::get('/dashboard', ...)->name('dashboard');
Route::resource('produits', ProductController::class)->names('products');

// Génération de liens
route('dashboard') // → /dashboard
route('products.index') // → /produits
```

### Après (routes avec préfixe)
```php
Route::prefix('{code_user}/{shop_slug}')->group(function () {
    Route::get('/dashboard', ...)->name('dashboard');
    Route::resource('produits', ProductController::class)->names('products');
});

// Génération de liens
user_route('dashboard') // → /ABC12345/ma-boutique/dashboard
user_route('products.index') // → /ABC12345/ma-boutique/produits
```

## Bonnes pratiques

### 1. Dans les contrôleurs

```php
class ProductController extends Controller
{
    public function store(Request $request)
    {
        $product = Product::create([
            'shop_id' => session('active_shop_id'), // Défini automatiquement
            // ...
        ]);
        
        // Redirection avec helper
        return redirect(user_route('products.show', ['product' => $product->id]))
            ->with('success', 'Produit créé');
    }
}
```

### 2. Dans les vues React

```tsx
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';

export default function ProductList() {
    const { routeParams } = usePage().props;
    
    const createRoute = () => {
        return route('products.create', {
            code_user: routeParams.code_user,
            shop_slug: routeParams.shop_slug
        });
    };
    
    return (
        <Link href={createRoute()}>
            Créer un produit
        </Link>
    );
}
```

### 3. Vérification de la boutique active

```php
// Dans un contrôleur
$shop = current_shop();

if (!$shop) {
    return redirect()->route('login')
        ->with('error', 'Veuillez sélectionner une boutique');
}

// Utiliser la boutique
$products = $shop->products()->get();
```

## Tests

### Test de validation du middleware

```php
public function test_user_cannot_access_another_user_shop()
{
    $user1 = User::factory()->create(['code_user' => 'USER001']);
    $shop1 = Shop::factory()->create(['user_id' => $user1->id, 'slug' => 'shop-1']);
    
    $user2 = User::factory()->create(['code_user' => 'USER002']);
    
    $this->actingAs($user2);
    
    // Tentative d'accès à la boutique de user1
    $response = $this->get('/USER001/shop-1/dashboard');
    
    $response->assertStatus(403);
}
```

### Test de redirection après login

```php
public function test_redirects_to_user_dashboard_after_login()
{
    $user = User::factory()->create([
        'code_user' => 'ABC12345',
        'email' => 'test@example.com',
        'password' => bcrypt('password')
    ]);
    
    $shop = Shop::factory()->create([
        'user_id' => $user->id,
        'slug' => 'my-shop'
    ]);
    
    $response = $this->post('/login', [
        'email' => 'test@example.com',
        'password' => 'password'
    ]);
    
    $response->assertRedirect('/ABC12345/my-shop/dashboard');
}
```

## Troubleshooting

### Problème: "Route dashboard not found"

**Solution:** Assurez-vous que la route existe dans le groupe avec préfixe:

```php
Route::prefix('{code_user}/{shop_slug}')->group(function () {
    Route::get('/dashboard', ...)->name('dashboard');
});
```

### Problème: "code_user parameter is required"

**Solution:** Utilisez `user_route()` au lieu de `route()`:

```php
// ❌ Ne fonctionne pas
return redirect(route('dashboard'));

// ✅ Fonctionne
return redirect(user_route('dashboard'));
```

### Problème: 404 sur toutes les routes

**Solution:** Vérifiez que le middleware est bien appliqué et que l'utilisateur a un `code_user` et une boutique.

## Fichiers modifiés

- ✅ `routes/web.php` - Structure des routes avec préfixe
- ✅ `app/Http/Middleware/ValidateUserShopAccess.php` - Middleware de validation
- ✅ `app/Http/Middleware/HandleInertiaRequests.php` - Partage des données avec Inertia
- ✅ `app/Http/Controllers/Auth/RedirectsUsers.php` - Redirection après auth
- ✅ `app/Helpers/RouteHelper.php` - Helpers pour génération d'URLs
- ✅ `composer.json` - Autoload des helpers

## Commandes utiles

```bash
# Regénérer l'autoload après modification des helpers
composer dump-autoload

# Lister toutes les routes
php artisan route:list

# Lister les routes avec préfixe
php artisan route:list | grep "code_user"

# Effacer le cache des routes
php artisan route:clear
```
