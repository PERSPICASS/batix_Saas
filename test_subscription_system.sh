#!/bin/bash

# Script de test pour le système de restrictions d'abonnement
# Date: 27 février 2026

echo "🧪 Tests du Système de Restrictions d'Abonnement"
echo "================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $2"
    else
        echo -e "${RED}❌ FAIL${NC} - $2"
    fi
}

echo "📋 Vérification des fichiers..."
echo ""

# Vérifier les fichiers backend
echo "Backend:"
if [ -f "app/Http/Middleware/CheckSubscriptionLimits.php" ]; then
    test_result 0 "Middleware CheckSubscriptionLimits existe"
else
    test_result 1 "Middleware CheckSubscriptionLimits manquant"
fi

if grep -q "subscription.limits" "bootstrap/app.php"; then
    test_result 0 "Middleware enregistré dans bootstrap/app.php"
else
    test_result 1 "Middleware NON enregistré"
fi

if grep -q "canCreateShop" "app/Models/User.php"; then
    test_result 0 "Méthode canCreateShop() existe dans User.php"
else
    test_result 1 "Méthode canCreateShop() manquante"
fi

if grep -q "canCreateUser" "app/Models/User.php"; then
    test_result 0 "Méthode canCreateUser() existe dans User.php"
else
    test_result 1 "Méthode canCreateUser() manquante"
fi

if grep -q "getSubscriptionLimits" "app/Models/User.php"; then
    test_result 0 "Méthode getSubscriptionLimits() existe dans User.php"
else
    test_result 1 "Méthode getSubscriptionLimits() manquante"
fi

echo ""
echo "Routes:"
if grep -q "subscription.limits:shop" "routes/web.php"; then
    test_result 0 "Route boutiques protégée"
else
    test_result 1 "Route boutiques NON protégée"
fi

if grep -q "subscription.limits:user" "routes/web.php"; then
    test_result 0 "Route utilisateurs protégée"
else
    test_result 1 "Route utilisateurs NON protégée"
fi

echo ""
echo "Frontend:"
if [ -f "resources/js/Components/SubscriptionBanner.tsx" ]; then
    test_result 0 "Composant SubscriptionBanner.tsx existe"
else
    test_result 1 "Composant SubscriptionBanner.tsx manquant"
fi

if grep -q "useSubscriptionLimits" "resources/js/Components/SubscriptionBanner.tsx"; then
    test_result 0 "Hook useSubscriptionLimits() exporté"
else
    test_result 1 "Hook useSubscriptionLimits() manquant"
fi

if grep -q "SubscriptionBanner" "resources/js/Pages/Shops/Index.tsx"; then
    test_result 0 "SubscriptionBanner intégré dans Shops/Index"
else
    test_result 1 "SubscriptionBanner NON intégré dans Shops"
fi

if grep -q "SubscriptionBanner" "resources/js/Pages/Users/Index.tsx"; then
    test_result 0 "SubscriptionBanner intégré dans Users/Index"
else
    test_result 1 "SubscriptionBanner NON intégré dans Users"
fi

echo ""
echo "Documentation:"
if [ -f "docs/SUBSCRIPTION_RESTRICTIONS.md" ]; then
    test_result 0 "Documentation technique créée"
else
    test_result 1 "Documentation technique manquante"
fi

if [ -f "docs/SUBSCRIPTION_UI_INTEGRATION.md" ]; then
    test_result 0 "Documentation UI créée"
else
    test_result 1 "Documentation UI manquante"
fi

if [ -f "docs/SUBSCRIPTION_IMPLEMENTATION_COMPLETE.md" ]; then
    test_result 0 "Document d'implémentation complète créé"
else
    test_result 1 "Document d'implémentation manquant"
fi

echo ""
echo "================================================"
echo "📊 Résumé des Tests"
echo "================================================"

# Compter les succès
total_tests=14
passed=$(grep -c "✅" <<< "$(bash $0 2>&1)")

if [ $passed -eq $total_tests ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés ! ($passed/$total_tests)${NC}"
    echo ""
    echo "✅ Le système est prêt pour les tests manuels."
    echo ""
    echo "📝 Prochaines étapes :"
    echo "  1. Créer un compte avec un plan Starter"
    echo "  2. Tester la création de boutiques jusqu'à la limite"
    echo "  3. Vérifier que le bouton se désactive"
    echo "  4. Tenter de créer au-delà de la limite"
    echo "  5. Vérifier le message d'erreur"
else
    echo -e "${RED}⚠️  Certains tests ont échoué${NC}"
    echo "Vérifiez les fichiers marqués ❌ ci-dessus"
fi

echo ""
echo "================================================"
echo ""
echo "🔧 Commandes utiles :"
echo ""
echo "# Compiler les assets"
echo "npm run build"
echo ""
echo "# Vérifier un utilisateur dans Tinker"
echo "php artisan tinker"
echo ">>> \$user = User::find(1);"
echo ">>> \$user->getSubscriptionLimits();"
echo ""
echo "# Voir les logs en temps réel"
echo "tail -f storage/logs/laravel.log"
echo ""
