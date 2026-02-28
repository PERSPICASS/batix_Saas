<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class FreePlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Plan FREE - 30 jours d'essai gratuit
        $freePlan = [
            'name' => 'Free',
            'slug' => 'free',
            'description' => 'Plan gratuit pour découvrir Batix - Valide 30 jours',
            'price' => 0.00, // Gratuit
            'max_shops' => 1,
            'max_users' => 2, // Propriétaire + 1 employé
            'features' => [
                '1 boutique',
                '2 utilisateurs (vous + 1 employé)',
                'Gestion des produits',
                'Gestion des ventes',
                'Gestion des clients',
                'Gestion du stock',
                'Rapports de base',
                '✨ Valide 30 jours',
                'Support par email'
            ],
            'is_active' => true,
        ];

        // Créer ou mettre à jour le plan FREE
        $plan = SubscriptionPlan::updateOrCreate(
            ['slug' => $freePlan['slug']],
            $freePlan
        );

        $this->command->info('✅ Plan FREE créé/mis à jour avec succès!');
        $this->command->newLine();
        
        $this->command->table(
            ['Attribut', 'Valeur'],
            [
                ['ID', $plan->id],
                ['Nom', $plan->name],
                ['Slug', $plan->slug],
                ['Prix', $plan->price . ' FCFA (GRATUIT)'],
                ['Max boutiques', $plan->max_shops],
                ['Max utilisateurs', $plan->max_users],
                ['Validité', '30 jours'],
                ['Status', $plan->is_active ? 'Actif' : 'Inactif']
            ]
        );
        
        $this->command->newLine();
        $this->command->info('📋 Liste de tous les plans (par prix):');
        
        $allPlans = SubscriptionPlan::orderBy('price')->get(['name', 'price', 'max_shops', 'max_users']);
        $this->command->table(
            ['Plan', 'Prix (FCFA)', 'Boutiques', 'Utilisateurs'],
            $allPlans->map(function ($plan) {
                return [
                    $plan->name,
                    $plan->price == 0 ? 'GRATUIT' : number_format($plan->price, 0, ',', ' '),
                    $plan->max_shops == -1 ? 'Illimité' : $plan->max_shops,
                    $plan->max_users == -1 ? 'Illimité' : $plan->max_users
                ];
            })->toArray()
        );
    }
}
