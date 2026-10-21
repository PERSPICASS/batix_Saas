<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'shop_id' => Shop::factory(),
            'user_id' => User::factory(),
            'title' => fake()->words(3, true),
            'amount' => fake()->randomFloat(2, 10, 500),
            'category' => fake()->randomElement(['Loyer', 'Fournitures', 'Transport', 'Autre']),
            'expense_date' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'payment_method' => fake()->randomElement(['cash', 'card', 'transfer']),
            'reference' => fake()->optional()->bothify('REF-####'),
            'notes' => fake()->optional()->sentence(),
            'receipt' => null,
        ];
    }
}
