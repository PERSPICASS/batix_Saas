<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreatePlatformAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create-platform';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create platform admin account';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Vérification du compte admin plateforme...');
        
        $email = 'admin@batix.com';
        $password = 'AdminBatix2026!';
        
        // Vérifier si le compte existe
        $existing = User::where('email', $email)->first();
        
        if ($existing) {
            $this->warn('⚠️  Le compte existe déjà!');
            $this->info('');
            $this->info('📧 Email: ' . $existing->email);
            $this->info('🎫 Code User: ' . $existing->code_user);
            $this->info('🔑 Role: ' . $existing->role);
            $this->info('✅ Actif: ' . ($existing->is_active ? 'Oui' : 'Non'));
            
            // Mettre à jour le mot de passe si nécessaire
            if ($this->confirm('Voulez-vous réinitialiser le mot de passe ?', false)) {
                $existing->password = Hash::make($password);
                $existing->role = 'admin_platforme';
                $existing->is_active = true;
                $existing->email_verified_at = now();
                $existing->save();
                
                $this->info('✅ Mot de passe mis à jour!');
                $this->info('🔑 Nouveau mot de passe: ' . $password);
            }
            
            return 0;
        }
        
        // Créer le compte
        $this->info('📝 Création du compte...');
        
        $admin = User::create([
            'name' => 'Admin Plateforme',
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin_platforme',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        
        $this->info('');
        $this->info('✅ Compte admin_platforme créé avec succès!');
        $this->info('');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('📧 Email:    ' . $email);
        $this->info('🔑 Password: ' . $password);
        $this->info('🎫 Code:     ' . $admin->code_user);
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('');
        $this->info('🔗 URL connexion: ' . url('/login'));
        $this->info('🔗 Dashboard:     ' . url('/platform-admin/dashboard'));
        $this->info('');
        
        return 0;
    }
}
