<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Shop;
use Illuminate\Database\Seeder;

class PredefinedCategoriesSeeder extends Seeder
{
    /**
     * Seed predefined categories for a specific shop or all shops.
     */
    public function run(?int $shopId = null): void
    {
        $predefinedCategories = config('categories.predefined', []);

        if (empty($predefinedCategories)) {
            $this->command->warn('No predefined categories found in config.');
            return;
        }

        if ($shopId) {
            // Seed for a specific shop
            $shop = Shop::find($shopId);
            if (!$shop) {
                $this->command->error("Shop with ID {$shopId} not found.");
                return;
            }

            $this->seedCategoriesForShop($shop, $predefinedCategories);
            $this->command->info("Predefined categories seeded for shop: {$shop->name}");
        } else {
            // Seed for all shops
            $shops = Shop::all();
            
            if ($shops->isEmpty()) {
                $this->command->warn('No shops found. Please create a shop first.');
                return;
            }

            foreach ($shops as $shop) {
                $this->seedCategoriesForShop($shop, $predefinedCategories);
            }

            $this->command->info("Predefined categories seeded for {$shops->count()} shop(s).");
        }
    }

    /**
     * Seed categories for a specific shop
     */
    private function seedCategoriesForShop(Shop $shop, array $categories): void
    {
        foreach ($categories as $categoryData) {
            // Vérifier si la catégorie existe déjà (par slug)
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
            }
        }
    }
}
