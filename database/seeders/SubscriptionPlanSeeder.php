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
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Parfait pour les petites entreprises qui débutent',
                'price' => 15000.00,
                'max_shops' => 1,
                'max_users' => 3,
                'features' => [
                    '1 boutique',
                    'Jusqu\'à 3 utilisateurs',
                    'Gestion des produits',
                    'Gestion des ventes',
                    'Gestion des clients',
                    'Rapports de base',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Growth',
                'slug' => 'growth',
                'description' => 'Idéal pour les entreprises en croissance avec plusieurs points de vente',
                'price' => 35000.00,
                'max_shops' => 3,
                'max_users' => 10,
                'features' => [
                    'Jusqu\'à 3 boutiques',
                    'Jusqu\'à 10 utilisateurs',
                    'Toutes les fonctionnalités Starter',
                    'Gestion des fournisseurs',
                    'Gestion des stocks avancée',
                    'Rapports détaillés',
                    'Support prioritaire',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Scale',
                'slug' => 'scale',
                'description' => 'Solution complète pour les grandes entreprises et chaînes de magasins',
                'price' => 75000.00,
                'max_shops' => -1,
                'max_users' => -1,
                'features' => [
                    'Boutiques illimitées',
                    'Utilisateurs illimités',
                    'Toutes les fonctionnalités Growth',
                    'Multi-devises',
                    'API complète',
                    'Rapports personnalisés',
                    'Support dédié 24/7',
                    'Formation personnalisée',
                ],
                'is_active' => true,
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
