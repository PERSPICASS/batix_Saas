<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Shop;

class CategoryService
{
    /**
     * Get all predefined categories from config
     */
    public function getPredefinedCategories(): array
    {
        return config('categories.predefined', []);
    }

    /**
     * Seed predefined categories for a shop
     */
    public function seedPredefinedCategoriesForShop(Shop $shop, ?array $selectedCategories = null): int
    {
        $predefinedCategories = $this->getPredefinedCategories();
        
        if (empty($predefinedCategories)) {
            return 0;
        }

        // Si des catégories spécifiques sont sélectionnées, filtrer
        if ($selectedCategories !== null) {
            $predefinedCategories = array_filter($predefinedCategories, function ($category) use ($selectedCategories) {
                return in_array($category['slug'], $selectedCategories);
            });
        }

        $count = 0;

        foreach ($predefinedCategories as $categoryData) {
            // Vérifier si la catégorie existe déjà
            $exists = Category::where('shop_id', $shop->id)
                ->where('slug', $categoryData['slug'])
                ->exists();

            if (!$exists) {
                Category::create([
                    'shop_id' => $shop->id,
                    'name' => $categoryData['name'],
                    'slug' => $categoryData['slug'],
                    'description' => $categoryData['description'] ?? null,
                    'color' => $categoryData['color'] ?? null,
                    'icon' => $categoryData['icon'] ?? null,
                    'is_active' => $categoryData['is_active'] ?? true,
                    'order' => $categoryData['order'] ?? 0,
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Get predefined categories grouped by usage type
     */
    public function getGroupedPredefinedCategories(): array
    {
        $categories = $this->getPredefinedCategories();

        return [
            'retail' => array_filter($categories, fn($cat) => in_array($cat['slug'], [
                'alimentation-boissons',
                'electronique',
                'vetements-mode',
                'sante-beaute',
                'maison-jardin',
                'sports-loisirs',
                'livres-papeterie',
                'jouets-enfants',
            ])),
            'specialized' => array_filter($categories, fn($cat) => in_array($cat['slug'], [
                'automobile',
                'animaux',
                'outils-bricolage',
                'bijoux-accessoires',
                'informatique-logiciels',
            ])),
            'services' => array_filter($categories, fn($cat) => in_array($cat['slug'], [
                'services',
                'autres',
            ])),
        ];
    }

    /**
     * Check if a shop has predefined categories
     */
    public function hasPredefinedCategories(Shop $shop): bool
    {
        $predefinedSlugs = array_column($this->getPredefinedCategories(), 'slug');
        
        return Category::where('shop_id', $shop->id)
            ->whereIn('slug', $predefinedSlugs)
            ->exists();
    }

    /**
     * Get count of predefined categories for a shop
     */
    public function countPredefinedCategories(Shop $shop): int
    {
        $predefinedSlugs = array_column($this->getPredefinedCategories(), 'slug');
        
        return Category::where('shop_id', $shop->id)
            ->whereIn('slug', $predefinedSlugs)
            ->count();
    }
}
