<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Shop>
 */
class ShopFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company();
        
        return [
            'user_id' => User::factory(),
            'name' => $name,
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1, 9999),
            'description' => fake()->optional()->sentence(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'postal_code' => fake()->postcode(),
            'country' => fake()->randomElement(['France', 'Maroc', 'Belgique', 'Suisse']),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'is_active' => true,
        ];
    }

    /**
     * En production, créer sa première boutique octroie l'essai gratuit
     * (ShopController::store) : une boutique dont le propriétaire n'a aucun abonnement
     * est un état qui n'existe pas. Le supposer donnait des comptes de test capables
     * d'écrire là où EnforceSubscriptionReadOnly les met — à raison — en lecture seule.
     *
     * `firstOrCreate` : un compte à plusieurs boutiques garde un seul abonnement, et un
     * test qui crée le sien (quotas, expiration) n'est pas écrasé. Le plan est sans
     * limite pour qu'un quota ne vienne pas interférer avec des tests qui portent sur
     * tout autre chose. Pour les fixtures qui réaffectent `user_id` après coup, voir
     * TestCase::subscribeOwnerOf().
     */
    public function configure(): static
    {
        return $this->afterCreating(function (\App\Models\Shop $shop) {
            \App\Models\Subscription::firstOrCreate(
                ['user_id' => $shop->user_id],
                [
                    'subscription_plan_id' => \App\Models\SubscriptionPlan::factory()->create([
                        'max_shops'    => -1,
                        'max_users'    => -1,
                        'max_products' => -1,
                        'max_depots'   => -1,
                    ])->id,
                    'status'     => 'active',
                    'started_at' => now(),
                    'expires_at' => now()->addYear(),
                    'amount'     => 0,
                ]
            );
        });
    }

    /**
     * Indicate that the shop is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
