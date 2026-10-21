<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;

class SubscriptionTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all super_admin users
        $superAdmins = User::where('role', 'super_admin')->get();
        
        if ($superAdmins->isEmpty()) {
            $this->command->warn('No super_admin users found. Create some accounts first.');
            return;
        }

        // Get all plans
        $plans = SubscriptionPlan::all();
        
        if ($plans->isEmpty()) {
            $this->command->warn('No subscription plans found. Run SubscriptionPlanSeeder first.');
            return;
        }

        foreach ($superAdmins as $user) {
            // Check if user already has a subscription
            if ($user->subscriptions()->exists()) {
                continue;
            }

            // Assign a random plan
            $plan = $plans->random();
            
            // Random status
            $statuses = ['active', 'trial', 'expired'];
            $status = $statuses[array_rand($statuses)];
            
            $startedAt = now()->subMonths(rand(1, 6));
            $expiresAt = $status === 'expired' 
                ? $startedAt->copy()->addMonth()->subDays(5)
                : $startedAt->copy()->addMonth();
            
            Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'status' => $status,
                'started_at' => $startedAt,
                'expires_at' => $expiresAt,
                'amount' => $plan->price,
                'billing_cycle' => 'monthly',
            ]);

            $this->command->info("Created {$status} subscription for {$user->name} ({$plan->name})");
        }
    }
}
