#!/bin/bash

echo "🔧 Nettoyage et recompilation après fix HTTPS..."

# Vider tous les caches Laravel
echo "📦 Nettoyage des caches Laravel..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Recompiler la configuration
echo "⚙️  Recompilation de la configuration..."
php artisan config:cache

# Recompiler les assets frontend
echo "🎨 Compilation des assets frontend..."
npm run build

echo "✅ Terminé ! Les changements HTTPS sont maintenant actifs."
echo ""
echo "📝 N'oubliez pas de vérifier votre .env :"
echo "   APP_URL=https://dev.batixpro.com"
echo "   SESSION_SECURE_COOKIE=true"
echo ""
echo "🔄 Redémarrez vos services :"
echo "   sudo systemctl restart php8.3-fpm"
echo "   sudo systemctl reload nginx"
