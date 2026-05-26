<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        \DB::table('subscription_plans')->where('slug', 'free')->update(['is_active' => false]);

        \DB::table('subscription_plans')->where('slug', 'scale')->update([
            'name' => 'Pro',
            'slug' => 'pro',
            'description' => 'Pour les petites et moyennes entreprises',
            'max_shops' => 6,
        ]);

        // Create or update Entreprise plan
        $enterpriseExists = \DB::table('subscription_plans')->where('slug', 'enterprise')->exists();

        if ($enterpriseExists) {
            \DB::table('subscription_plans')->where('slug', 'enterprise')->update([
                'name' => 'Entreprise',
                'description' => 'Plan sur mesure pour les grandes entreprises',
                'price' => 0,
                'max_shops' => -1,
                'max_users' => -1,
                'max_products' => -1,
                'max_depots' => -1,
                'features' => json_encode([
                    'Boutiques illimitées',
                    'Utilisateurs illimités',
                    'Produits illimités',
                    'Support prioritaire',
                    'Configurations personnalisées',
                    'API accès complet',
                ]),
                'is_active' => true,
                'sort_order' => 4,
                'updated_at' => now(),
            ]);
        } else {
            \DB::table('subscription_plans')->insert([
                'name' => 'Entreprise',
                'slug' => 'enterprise',
                'description' => 'Plan sur mesure pour les grandes entreprises',
                'price' => 0,
                'max_shops' => -1,
                'max_users' => -1,
                'max_products' => -1,
                'max_depots' => -1,
                'features' => json_encode([
                    'Boutiques illimitées',
                    'Utilisateurs illimités',
                    'Produits illimités',
                    'Support prioritaire',
                    'Configurations personnalisées',
                    'API accès complet',
                ]),
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \DB::table('subscription_plans')->where('slug', 'enterprise')->delete();

        \DB::table('subscription_plans')->where('slug', 'pro')->update([
            'name' => 'Scale',
            'slug' => 'scale',
            'description' => 'For enterprises',
            'max_shops' => -1,
        ]);

        \DB::table('subscription_plans')->where('slug', 'free')->update(['is_active' => true]);
    }
};
