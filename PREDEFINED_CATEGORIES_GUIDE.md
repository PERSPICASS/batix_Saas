# Guide des Catégories Prédéfinies

## Vue d'ensemble

Le système de catégories prédéfinies permet aux nouvelles boutiques de démarrer rapidement avec un ensemble de catégories standards adaptées aux commerces de détail.

## Catégories Disponibles

### 🛒 Commerce de Détail (Retail)
1. **Alimentation & Boissons** - Produits alimentaires, boissons, épicerie
2. **Électronique** - Ordinateurs, téléphones, accessoires électroniques
3. **Vêtements & Mode** - Vêtements, chaussures, accessoires de mode
4. **Santé & Beauté** - Cosmétiques, soins personnels, produits de santé
5. **Maison & Jardin** - Meubles, décoration, jardinage
6. **Sports & Loisirs** - Équipements sportifs, jeux, activités de loisirs
7. **Livres & Papeterie** - Livres, fournitures scolaires, papeterie
8. **Jouets & Enfants** - Jouets, vêtements pour enfants, articles de puériculture

### 🔧 Commerce Spécialisé
9. **Automobile** - Pièces auto, accessoires, entretien véhicules
10. **Animaux** - Nourriture, accessoires, soins pour animaux
11. **Outils & Bricolage** - Outils, matériel de bricolage, quincaillerie
12. **Bijoux & Accessoires** - Bijoux, montres, accessoires de luxe
13. **Informatique & Logiciels** - Matériel informatique, logiciels, services IT

### 💼 Services
14. **Services** - Services divers, prestations
15. **Autres** - Produits divers non classés

## Configuration

Les catégories sont définies dans le fichier `config/categories.php` :

```php
'predefined' => [
    [
        'name' => 'Alimentation & Boissons',
        'slug' => 'alimentation-boissons',
        'description' => 'Produits alimentaires, boissons, épicerie',
        'color' => '#10B981',
        'icon' => 'shopping-cart',
        'is_active' => true,
        'order' => 1,
    ],
    // ... autres catégories
]
```

### Propriétés de chaque catégorie

- **name** : Nom affiché de la catégorie
- **slug** : Identifiant unique URL-friendly
- **description** : Description détaillée
- **color** : Code couleur hexadécimal pour l'UI
- **icon** : Nom de l'icône (Heroicons ou autre bibliothèque)
- **is_active** : Statut actif/inactif
- **order** : Ordre d'affichage

## Utilisation

### 1. Commande Artisan

#### Seeder toutes les boutiques
```bash
php artisan categories:seed-predefined
```

#### Seeder une boutique spécifique
```bash
php artisan categories:seed-predefined --shop=1
```

### 2. Via le Seeder

```php
use Database\Seeders\PredefinedCategoriesSeeder;

// Dans DatabaseSeeder.php ou autre seeder
$this->call(PredefinedCategoriesSeeder::class);

// Ou pour une boutique spécifique
(new PredefinedCategoriesSeeder())->run(shopId: 1);
```

### 3. Via le Service

```php
use App\Services\CategoryService;

$categoryService = new CategoryService();

// Seeder toutes les catégories pour une boutique
$count = $categoryService->seedPredefinedCategoriesForShop($shop);

// Seeder seulement certaines catégories
$selectedSlugs = ['alimentation-boissons', 'electronique', 'vetements-mode'];
$count = $categoryService->seedPredefinedCategoriesForShop($shop, $selectedSlugs);

// Obtenir les catégories groupées
$grouped = $categoryService->getGroupedPredefinedCategories();
// Returns: ['retail' => [...], 'specialized' => [...], 'services' => [...]]

// Vérifier si une boutique a des catégories prédéfinies
$hasPredefined = $categoryService->hasPredefinedCategories($shop);

// Compter les catégories prédéfinies d'une boutique
$count = $categoryService->countPredefinedCategories($shop);
```

### 4. Lors de la création d'une boutique

Vous pouvez automatiquement ajouter les catégories lors de la création d'une boutique en ajoutant dans votre `ShopController@store` :

```php
use App\Services\CategoryService;

public function store(Request $request)
{
    // Créer la boutique
    $shop = Shop::create($validated);
    
    // Ajouter les catégories prédéfinies
    $categoryService = new CategoryService();
    $categoryService->seedPredefinedCategoriesForShop($shop);
    
    return redirect()->route('shops.index');
}
```

## Personnalisation

### Ajouter de nouvelles catégories

Modifiez le fichier `config/categories.php` :

```php
[
    'name' => 'Ma Nouvelle Catégorie',
    'slug' => 'ma-nouvelle-categorie',
    'description' => 'Description de la catégorie',
    'color' => '#FF5733',
    'icon' => 'sparkles',
    'is_active' => true,
    'order' => 16,
]
```

### Modifier les catégories existantes

Éditez directement le fichier de configuration, puis relancez le seeder si nécessaire.

### Groupes personnalisés

Modifiez la méthode `getGroupedPredefinedCategories()` dans `CategoryService` pour créer vos propres groupes :

```php
return [
    'mon_groupe' => array_filter($categories, fn($cat) => in_array($cat['slug'], [
        'slug-1',
        'slug-2',
    ])),
];
```

## Intégration UI

### Afficher les catégories dans un formulaire de sélection

```tsx
// Dans un composant React/Inertia
import { usePage } from '@inertiajs/react';

const { predefinedCategories } = usePage().props;

<select>
    {predefinedCategories.map((category) => (
        <option key={category.slug} value={category.slug}>
            {category.name}
        </option>
    ))}
</select>
```

### Afficher avec des couleurs

```tsx
<div className="flex items-center gap-2">
    <div 
        className="w-4 h-4 rounded-full" 
        style={{ backgroundColor: category.color }}
    />
    <span>{category.name}</span>
</div>
```

## Migration pour boutiques existantes

Pour ajouter les catégories prédéfinies à toutes les boutiques existantes :

```bash
php artisan categories:seed-predefined
```

La commande vérifie automatiquement les doublons (par slug) et ne crée que les catégories manquantes.

## Avantages

✅ **Démarrage rapide** : Les nouveaux utilisateurs ont immédiatement des catégories
✅ **Standardisation** : Catégories cohérentes entre les boutiques
✅ **Flexibilité** : Les utilisateurs peuvent modifier/supprimer les catégories
✅ **Évolutif** : Facile d'ajouter de nouvelles catégories
✅ **Multi-boutique** : Chaque boutique a ses propres instances des catégories
✅ **Sécurité** : Isolation complète entre boutiques (shop_id)

## Bonnes Pratiques

1. **Lors de la création d'une boutique** : Proposer un choix de catégories prédéfinies
2. **Interface utilisateur** : Afficher les catégories avec leurs couleurs et icônes
3. **Personnalisation** : Permettre aux utilisateurs de modifier les catégories après création
4. **Documentation** : Expliquer aux utilisateurs qu'ils peuvent personnaliser les catégories

## Exemples d'utilisation

### Scénario 1 : Nouvelle boutique avec catégories par défaut
```php
$shop = Shop::create($data);
app(CategoryService::class)->seedPredefinedCategoriesForShop($shop);
```

### Scénario 2 : Boutique de vêtements (catégories sélectionnées)
```php
$shop = Shop::create($data);
app(CategoryService::class)->seedPredefinedCategoriesForShop($shop, [
    'vetements-mode',
    'bijoux-accessoires',
    'sante-beaute'
]);
```

### Scénario 3 : Migration de données existantes
```php
// Dans une migration ou un seeder
Shop::chunk(100, function ($shops) {
    $service = app(CategoryService::class);
    foreach ($shops as $shop) {
        if (!$service->hasPredefinedCategories($shop)) {
            $service->seedPredefinedCategoriesForShop($shop);
        }
    }
});
```

## Support

Pour toute question ou suggestion concernant les catégories prédéfinies, consultez la documentation ou contactez l'équipe de développement.
