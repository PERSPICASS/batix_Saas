<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name'        => 'Free',
                'slug'        => 'free',
                'description' => 'Découvrez Batix gratuitement — valable 30 jours',
                'price'       => 0.00,
                'max_shops'   => 1,
                'max_users'   => 2,
                'max_products'=> 100,
                'max_depots'  => 0,
                'features'    => [],
                'is_active'   => true,
                'sort_order'  => 0,
            ],
            [
                'name'        => 'Starter',
                'slug'        => 'starter',
                'description' => 'Parfait pour les petites entreprises qui débutent',
                'price'       => 15000.00,
                'max_shops'   => 1,
                'max_users'   => 3,
                'max_products'=> 500,
                'max_depots'  => 1,
                'features'    => [],
                'is_active'   => true,
                'sort_order'  => 1,
            ],
            [
                'name'        => 'Growth',
                'slug'        => 'growth',
                'description' => 'Idéal pour les entreprises en croissance avec plusieurs points de vente',
                'price'       => 35000.00,
                'max_shops'   => 3,
                'max_users'   => 10,
                'max_products'=> 1000,
                'max_depots'  => 3,
                'features'    => [],
                'is_active'   => true,
                'sort_order'  => 2,
            ],
            [
                'name'        => 'Scale',
                'slug'        => 'scale',
                'description' => 'Solution complète pour les grandes entreprises et chaînes de magasins',
                'price'       => 75000.00,
                'max_shops'   => -1,
                'max_users'   => -1,
                'max_products'=> -1,
                'max_depots'  => -1,
                'features'    => [],
                'is_active'   => true,
                'sort_order'  => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
