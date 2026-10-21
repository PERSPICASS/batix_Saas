#!/bin/bash

# Script pour créer le compte admin plateforme

cd /Users/fred/Documents/projects/laravel/batix_saas

echo "🔄 Migration de la base de données..."
php artisan migrate --force

echo ""
echo "👤 Création du compte admin plateforme..."

php artisan tinker << 'EOF'
$existing = \App\Models\User::where('email', 'admin@batix.com')->first();

if ($existing) {
    echo "✅ Le compte existe déjà!\n";
    echo "📧 Email: admin@batix.com\n";
    echo "🎫 Code User: " . $existing->code_user . "\n";
    echo "🔑 Role: " . $existing->role . "\n";
} else {
    $admin = \App\Models\User::create([
        'name' => 'Admin Plateforme',
        'email' => 'admin@batix.com',
        'password' => \Illuminate\Support\Facades\Hash::make('AdminBatix2026!'),
        'role' => 'admin_platforme',
        'is_active' => true,
        'email_verified_at' => now(),
    ]);
    
    echo "✅ Compte créé avec succès!\n";
    echo "\n";
    echo "📧 Email: admin@batix.com\n";
    echo "🔑 Password: AdminBatix2026!\n";
    echo "🎫 Code User: " . $admin->code_user . "\n";
    echo "\n";
    echo "🔗 URL connexion: " . url('/login') . "\n";
}
EOF

echo ""
echo "✅ Terminé!"
