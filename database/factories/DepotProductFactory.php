<?php

namespace Database\Factories;

use App\Models\Depot;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DepotProduct>
 */
class DepotProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'depot_id' => Depot::factory(),
            'product_id' => Product::factory(),
            'quantity' => fake()->numberBetween(0, 100),
            'min_stock_alert' => fake()->numberBetween(0, 10),
            'purchase_price' => fake()->randomFloat(2, 5, 100),
        ];
    }
}
