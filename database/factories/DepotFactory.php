<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Depot>
 */
class DepotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // code_user is a plain string column (not a relation) that must match the
        // owning user's own code_user, so both are derived from the same user here
        // rather than resolved as two independent factories.
        $user = User::factory()->create();

        return [
            'user_id' => $user->id,
            'code_user' => $user->code_user,
            'name' => fake()->words(2, true) . ' Depot',
            'address' => fake()->optional()->address(),
            'city' => fake()->optional()->city(),
            'phone' => fake()->optional()->phoneNumber(),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }

    /**
     * Attach the depot to a specific owning user (sets both code_user and user_id).
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'code_user' => $user->code_user,
            'user_id' => $user->id,
        ]);
    }
}
