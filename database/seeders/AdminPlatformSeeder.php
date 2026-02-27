<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminPlatformSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Vérifier si le compte existe déjà
        $existingAdmin = User::where('email', 'admin@batix.com')->first();
        
        if ($existingAdmin) {
            $this->command->info('Le compte admin plateforme existe déjà.');
            $this->command->info('Email: admin@batix.com');
            $this->command->info('Code User: ' . $existingAdmin->code_user);
            return;
        }

        // Créer le compte admin plateforme
        $admin = User::create([
            'name' => 'Admin Plateforme',
            'email' => 'admin@batix.com',
            'password' => Hash::make('AdminBatix2026!'),
            'role' => 'admin_platforme',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->command->info('✅ Compte admin_platforme créé avec succès!');
        $this->command->info('');
        $this->command->info('📧 Email: admin@batix.com');
        $this->command->info('🔑 Password: AdminBatix2026!');
        $this->command->info('🎫 Code User: ' . $admin->code_user);
        $this->command->info('');
        $this->command->info('🔗 URL de connexion: ' . url('/login'));
        $this->command->info('🔗 Dashboard plateforme: ' . url('/platform-admin/dashboard'));
    }
}
