<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(3, true);
        $purchasePrice = fake()->randomFloat(2, 5, 100);
        $sellingPrice = $purchasePrice * fake()->randomFloat(2, 1.2, 2.5);

        return [
            'shop_id' => Shop::factory(),
            'category_id' => Category::factory(),
            'subcategory_id' => null,
            'name' => ucfirst($name),
            'description' => fake()->optional()->paragraph(),
            'sku' => strtoupper(Str::random(3)) . '-' . fake()->unique()->numberBetween(1000, 9999),
            'barcode' => fake()->optional()->ean13(),
            'unit' => fake()->randomElement(['piece', 'kg', 'liter', 'meter', 'box']),
            'purchase_price' => $purchasePrice,
            'selling_price' => $sellingPrice,
            'tax_rate' => fake()->randomElement([0, 5.5, 10, 20]),
            'stock_quantity' => fake()->numberBetween(0, 100),
            'min_stock_alert' => fake()->numberBetween(5, 20),
            'image' => null,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the product is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the product is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }

    /**
     * Indicate that the product has low stock.
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => fake()->numberBetween(1, 5),
            'min_stock_alert' => 10,
        ]);
    }
}
