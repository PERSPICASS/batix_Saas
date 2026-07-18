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
                // 14 jours, pas 30 : c'est ce que ShopController accorde réellement
                // (now()->addDays(14)) et ce qu'annonce la page d'accueil.
                'description' => 'Découvrez Batix gratuitement — valable 14 jours',
                'price'       => 0.00,
                'max_shops'   => 1,
                'max_users'   => 2,
                'max_products'=> -1,
                'max_depots'  => 0,
                'features'    => [
                    'Point de vente (caisse)',
                    'Gestion des produits et stocks',
                    'Facturation et devis',
                    'Tableau de bord et rapports',
                    'Essai valable 14 jours',
                ],
                'is_active'   => false,
                'sort_order'  => 0,
            ],
            [
                'name'        => 'Starter',
                'slug'        => 'starter',
                'description' => 'Parfait pour les petites entreprises qui débutent',
                'price'       => 18000.00,
                'max_shops'   => 1,
                'max_users'   => 3,
                'max_products'=> -1,
                'max_depots'  => 1,
                'features'    => [
                    'Facturation et devis clients',
                    'Gestion des stocks et inventaire physique',
                    'Point de vente (caisse) rapide',
                    'Codes-barres : scan et génération',
                    'Achats fournisseurs et suivi des dépenses',
                    'Ventes à crédit et suivi des créances',
                    'Gestion des retours produits',
                    'Fiche client (CRM de base)',
                    'Tableau de bord et rapports',
                    'Permissions par utilisateur',
                    'Journal d\'activité (audit)',
                    'Authentification à deux facteurs',
                    'Verrouillage d\'écran',
                    'Interface bilingue FR/EN et mode sombre',
                    'Support standard',
                ],
                'is_active'   => true,
                'sort_order'  => 1,
                'paddle_price_id'        => 'pri_01kw2j14wsvbxxpcsdxgmk9r6c',
                'paddle_price_id_yearly' => 'pri_01kwcexppmnz8dyh4xanzg18g8',
            ],
            [
                'name'        => 'Growth',
                'slug'        => 'growth',
                'description' => 'Idéal pour les entreprises en croissance avec plusieurs points de vente',
                'price'       => 45000.00,
                'max_shops'   => 3,
                'max_users'   => 10,
                'max_products'=> -1,
                'max_depots'  => 3,
                'features'    => [
                    'Analytique avancée avec graphiques',
                    'Factures récurrentes',
                    'Toutes les fonctionnalités Starter',
                    'Multi-boutiques (jusqu\'à 3) et multi-dépôts',
                    'Transfert de stock entre dépôts',
                    'Précommandes clients',
                    'Export Excel (produits, rapports)',
                    'Assistant IA (analyse ventes et stocks)',
                    'Invitations d\'équipe',
                    'Support prioritaire',
                ],
                'is_active'   => true,
                'sort_order'  => 2,
                'paddle_price_id'        => 'pri_01kw2hzxvs5zmag2xngcs2wkbw',
                'paddle_price_id_yearly' => 'pri_01kwcevxy47sr6w8q7wce4vx4q',
            ],
            [
                'name'        => 'Pro',
                'slug'        => 'pro',
                'description' => 'Pour les petites et moyennes entreprises',
                'price'       => 95000.00,
                'max_shops'   => 6,
                'max_users'   => -1,
                'max_products'=> -1,
                'max_depots'  => -1,
                'features'    => [
                    'Accès API REST et jetons API',
                    'Multi-devise par boutique',
                    'Toutes les fonctionnalités Growth',
                    'Jusqu\'à 6 boutiques, utilisateurs et dépôts illimités',
                    'Déclinaisons et attributs produits avancés',
                    'Synchronisation mobile',
                    'Support dédié 24/7',
                ],
                'is_active'   => true,
                'sort_order'  => 3,
                'paddle_price_id'        => 'pri_01kw2hybzhy9dvpzm9nvm851p8',
                'paddle_price_id_yearly' => 'pri_01kwcet0jbth889tj3fvpvn7zr',
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
                'features'    => [
                    'Configurations personnalisées',
                    'API accès complet',
                    'Boutiques illimitées',
                    'Utilisateurs illimités',
                    'Produits et dépôts illimités',
                    'Toutes les fonctionnalités Pro',
                    'Support prioritaire dédié',
                ],
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
