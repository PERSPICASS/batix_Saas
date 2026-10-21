<?php

namespace Database\Factories;

use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        
        return [
            'shop_id' => Shop::factory(),
            'name' => fake()->randomElement([
                'Électronique',
                'Vêtements',
                'Alimentation',
                'Outils',
                'Maison',
                'Sport',
                'Livres',
                'Jouets'
            ]) . ' ' . fake()->numberBetween(1, 100),
            'description' => fake()->optional()->sentence(),
            'color' => fake()->randomElement($colors),
            'icon' => fake()->optional()->randomElement(['package', 'tag', 'grid']),
            'order' => fake()->numberBetween(0, 100),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the category is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
