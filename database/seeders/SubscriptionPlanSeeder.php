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
                'max_products'=> -1,
                'max_depots'  => 0,
                'features'    => [],
                'is_active'   => false,
                'sort_order'  => 0,
            ],
            [
                'name'        => 'Starter',
                'slug'        => 'starter',
                'description' => 'Parfait pour les petites entreprises qui débutent',
                'price'       => 15000.00,
                'max_shops'   => 1,
                'max_users'   => 3,
                'max_products'=> -1,
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
                'max_products'=> -1,
                'max_depots'  => 3,
                'features'    => [],
                'is_active'   => true,
                'sort_order'  => 2,
            ],
            [
                'name'        => 'Pro',
                'slug'        => 'pro',
                'description' => 'Pour les petites et moyennes entreprises',
                'price'       => 75000.00,
                'max_shops'   => 6,
                'max_users'   => -1,
                'max_products'=> -1,
                'max_depots'  => -1,
                'features'    => [],
                'is_active'   => true,
                'sort_order'  => 3,
            ],
            [
                'name'        => 'Entreprise',
                'slug'        => 'enterprise',
                'description' => 'Plan sur mesure pour les grandes entreprises',
                'price'       => 0.00,
                'max_shops'   => -1,
                'max_users'   => -1,
                'max_products'=> -1,
                'max_depots'  => -1,
                'features'    => json_encode([
                    'Boutiques illimitées',
                    'Utilisateurs illimités',
                    'Produits illimités',
                    'Support prioritaire',
                    'Configurations personnalisées',
                    'API accès complet',
                ]),
                'is_active'   => true,
                'sort_order'  => 4,
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
