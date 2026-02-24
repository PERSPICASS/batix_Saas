# Guide des Catégories Prédéfinies - Quincaillerie

## Vue d'ensemble

Le système propose **27 catégories prédéfinies spécialisées pour le secteur de la quincaillerie**. Ces catégories sont automatiquement créées lors de la création de chaque nouvelle boutique dans le SaaS.

## 🔧 Les 27 Catégories de Quincaillerie

### Outils (3 catégories)
1. **Outils à Main** - Marteaux, tournevis, clés, pinces, scies manuelles
2. **Outils Électriques** - Perceuses, meuleuses, scies électriques, ponceuses
3. **Outillage de Mesure** - Mètres, niveaux, équerres, lasers de mesure

### Quincaillerie de Base (3 catégories)
4. **Visserie & Boulonnerie** - Vis, boulons, écrous, rondelles, chevilles
5. **Clous & Pointes** - Clous, pointes, agrafes, rivets
6. **Quincaillerie d'Assemblage** - Équerres, cornières, plaques de fixation, supports

### Serrurerie & Fermetures (3 catégories)
7. **Serrurerie** - Serrures, cylindres, verrous, cadenas
8. **Charnières & Paumelles** - Charnières, paumelles, fiches, gonds
9. **Poignées & Accessoires** - Poignées de porte, boutons, béquilles, rosaces

### Matériaux & Construction (3 catégories)
10. **Matériaux de Construction** - Ciment, plâtre, mortier, enduits
11. **Bois & Panneaux** - Planches, tasseaux, contreplaqué, panneaux
12. **Tubes & Profilés** - Tubes acier, PVC, alu, profilés métalliques

### Plomberie & Électricité (2 catégories)
13. **Plomberie** - Tuyaux, raccords, robinets, joints, sanitaires
14. **Électricité** - Câbles, prises, interrupteurs, disjoncteurs, gaines

### Peinture & Décoration (2 catégories)
15. **Peinture & Enduits** - Peintures, vernis, lasures, enduits, primaires
16. **Outils de Peinture** - Pinceaux, rouleaux, bacs, pistolets, rubans de masquage

### Fixation & Collage (2 catégories)
17. **Colles & Mastics** - Colles, mastics, silicones, adhésifs, résines
18. **Fixations Spéciales** - Chevilles expansion, scellements chimiques, tiges filetées

### Protection & Sécurité (2 catégories)
19. **Équipements de Protection** - Gants, lunettes, masques, casques, vêtements de travail
20. **Sécurité & Signalisation** - Extincteurs, détecteurs, panneaux, rubans de sécurité

### Jardin & Extérieur (2 catégories)
21. **Jardinage** - Outils de jardin, arrosage, tuteurs, grillages
22. **Aménagement Extérieur** - Clôtures, portails, dalles, pavés, bordures

### Entretien & Nettoyage (2 catégories)
23. **Produits d'Entretien** - Nettoyants, décapants, dégraissants, diluants
24. **Matériel de Nettoyage** - Balais, brosses, éponges, seaux, chiffons

### Rangement & Divers (3 catégories)
25. **Rangement & Organisation** - Boîtes, bacs, casiers, armoires, établis
26. **Accessoires & Consommables** - Lames, disques, forets, embouts, papier abrasif
27. **Autres Produits** - Produits divers et articles non classés

## 🚀 Utilisation

### Création Automatique pour Nouvelle Boutique

Les catégories sont automatiquement créées lors de la création d'une boutique. Ajoutez ceci dans votre `ShopController@store` :

```php
use App\Services\CategoryService;

public function store(Request $request)
{
    $validated = $request->validated();
    $validated['user_id'] = auth()->id();
    
    $shop = Shop::create($validated);
    
    // Créer automatiquement les 27 catégories de quincaillerie
    app(CategoryService::class)->seedPredefinedCategoriesForShop($shop);
    
    return redirect()->route('shops.index')
        ->with('success', 'Boutique créée avec 27 catégories de quincaillerie !');
}
```

### Commandes Artisan

```bash
# Ajouter les catégories à une boutique spécifique
php artisan categories:seed-predefined --shop=1

# Ajouter les catégories à toutes les boutiques existantes
php artisan categories:seed-predefined
```

### Via le Service

```php
use App\Services\CategoryService;

$categoryService = new CategoryService();

// Toutes les catégories (27)
$count = $categoryService->seedPredefinedCategoriesForShop($shop);

// Catégories sélectionnées (par exemple pour une petite quincaillerie)
$selectedCategories = [
    'outils-a-main',
    'outils-electriques',
    'visserie-boulonnerie',
    'clous-pointes',
    'serrurerie',
    'peinture-enduits',
];
$count = $categoryService->seedPredefinedCategoriesForShop($shop, $selectedCategories);
```

## 🎨 Code Couleur

Chaque catégorie a une couleur distinctive pour faciliter la visualisation :

- **Rouge** (#EF4444) - Outils à main
- **Ambre** (#F59E0B) - Outils électriques  
- **Bleu** (#3B82F6) - Outillage de mesure
- **Slate** (#64748B) - Visserie & boulonnerie
- **Indigo** (#6366F1) - Quincaillerie d'assemblage
- **Violet** (#8B5CF6) - Serrurerie
- **Cyan** (#06B6D4) - Plomberie
- **Jaune** (#FBBF24) - Électricité
- **Vert** (#10B981) - Peinture & enduits
- **Lime** (#84CC16) - Jardinage
- Et plus encore...

## 📊 Statistiques

```bash
# Vérifier le nombre de catégories créées
php artisan tinker
>>> $shop = App\Models\Shop::find(1);
>>> $shop->categories()->count();
=> 27

# Afficher toutes les catégories
>>> $shop->categories()->pluck('name')->all();
```

## ✨ Avantages

✅ **Complet** : Couvre tous les rayons d'une quincaillerie
✅ **Professionnel** : Catégories standards du secteur
✅ **Automatique** : Création lors de chaque nouvelle boutique
✅ **Personnalisable** : Les utilisateurs peuvent modifier/ajouter des catégories
✅ **Coloré** : Interface visuelle avec codes couleur
✅ **Organisé** : Ordre logique pour faciliter la navigation

## 🔄 Migration des Boutiques Existantes

Pour ajouter ces catégories aux boutiques déjà créées :

```bash
# Toutes les boutiques
php artisan categories:seed-predefined

# Ou boutique par boutique
php artisan categories:seed-predefined --shop=1
php artisan categories:seed-predefined --shop=2
```

## 📝 Personnalisation

### Ajouter une catégorie

Éditez `config/categories.php` et ajoutez :

```php
[
    'name' => 'Nouvelle Catégorie',
    'slug' => 'nouvelle-categorie',
    'description' => 'Description...',
    'color' => '#FF5733',
    'icon' => 'wrench',
    'is_active' => true,
    'order' => 28,
]
```

### Désactiver une catégorie

Changez `'is_active' => false` dans la configuration.

## 🎯 Cas d'Usage

### Petite Quincaillerie (10-15 catégories)
```php
$essentials = [
    'outils-a-main',
    'visserie-boulonnerie',
    'clous-pointes',
    'serrurerie',
    'peinture-enduits',
    'plomberie',
    'electricite',
];
```

### Quincaillerie Moyenne (15-20 catégories)
Ajouter : outils électriques, fixations spéciales, jardinage

### Grande Quincaillerie (toutes les catégories)
Utiliser les 27 catégories complètes

## 📞 Support

Pour toute question concernant les catégories de quincaillerie, consultez la documentation technique dans `PREDEFINED_CATEGORIES_GUIDE.md`.
