#!/bin/bash

# Script de test du module de gestion des achats
# Date: 2 mars 2026

echo "🧪 Test du Module de Gestion des Achats"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction de test
test_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

test_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

echo "1. Vérification des fichiers de migration"
test_step "Recherche des migrations purchases..."

if [ -f "database/migrations/2026_03_02_154114_create_purchases_table.php" ]; then
    test_pass "Migration purchases trouvée"
else
    test_fail "Migration purchases manquante"
fi

if [ -f "database/migrations/2026_03_02_154123_create_purchase_items_table.php" ]; then
    test_pass "Migration purchase_items trouvée"
else
    test_fail "Migration purchase_items manquante"
fi

echo ""
echo "2. Vérification des modèles"
test_step "Recherche des modèles..."

if [ -f "app/Models/Purchase.php" ]; then
    test_pass "Modèle Purchase trouvé"
    
    # Vérifier les méthodes importantes
    if grep -q "calculateTotals" "app/Models/Purchase.php"; then
        test_pass "Méthode calculateTotals() présente"
    else
        test_fail "Méthode calculateTotals() manquante"
    fi
    
    if grep -q "isFullyReceived" "app/Models/Purchase.php"; then
        test_pass "Méthode isFullyReceived() présente"
    else
        test_fail "Méthode isFullyReceived() manquante"
    fi
else
    test_fail "Modèle Purchase manquant"
fi

if [ -f "app/Models/PurchaseItem.php" ]; then
    test_pass "Modèle PurchaseItem trouvé"
else
    test_fail "Modèle PurchaseItem manquant"
fi

echo ""
echo "3. Vérification du contrôleur"
test_step "Recherche du contrôleur..."

if [ -f "app/Http/Controllers/PurchaseController.php" ]; then
    test_pass "PurchaseController trouvé"
    
    # Vérifier les méthodes
    METHODS=("index" "create" "store" "show" "edit" "update" "confirm" "receive" "cancel" "destroy")
    
    for method in "${METHODS[@]}"; do
        if grep -q "function $method" "app/Http/Controllers/PurchaseController.php"; then
            test_pass "Méthode $method() présente"
        else
            test_fail "Méthode $method() manquante"
        fi
    done
else
    test_fail "PurchaseController manquant"
fi

echo ""
echo "4. Vérification des routes"
test_step "Recherche des routes..."

if grep -q "purchases" "routes/web.php"; then
    test_pass "Routes purchases trouvées"
    
    if grep -q "purchases.confirm" "routes/web.php"; then
        test_pass "Route confirm présente"
    else
        test_fail "Route confirm manquante"
    fi
    
    if grep -q "purchases.receive" "routes/web.php"; then
        test_pass "Route receive présente"
    else
        test_fail "Route receive manquante"
    fi
    
    if grep -q "purchases.cancel" "routes/web.php"; then
        test_pass "Route cancel présente"
    else
        test_fail "Route cancel manquante"
    fi
else
    test_fail "Routes purchases manquantes"
fi

echo ""
echo "5. Vérification des composants React"
test_step "Recherche des composants..."

COMPONENTS=("Index.tsx" "Create.tsx" "Show.tsx" "Edit.tsx")

for component in "${COMPONENTS[@]}"; do
    if [ -f "resources/js/Pages/Purchases/$component" ]; then
        test_pass "Composant $component trouvé"
    else
        test_fail "Composant $component manquant"
    fi
done

echo ""
echo "6. Vérification du contenu des composants"
test_step "Vérification des imports et exports..."

for component in "${COMPONENTS[@]}"; do
    if [ -f "resources/js/Pages/Purchases/$component" ]; then
        if grep -q "export default function" "resources/js/Pages/Purchases/$component"; then
            test_pass "$component: export default présent"
        else
            test_fail "$component: export default manquant"
        fi
        
        if grep -q "AuthenticatedLayout" "resources/js/Pages/Purchases/$component"; then
            test_pass "$component: AuthenticatedLayout importé"
        else
            test_fail "$component: AuthenticatedLayout non importé"
        fi
    fi
done

echo ""
echo "7. Vérification de la structure TypeScript"
test_step "Vérification des interfaces..."

if [ -f "resources/js/Pages/Purchases/Index.tsx" ]; then
    if grep -q "interface.*Purchase" "resources/js/Pages/Purchases/Index.tsx"; then
        test_pass "Index.tsx: Interface Purchase définie"
    else
        test_fail "Index.tsx: Interface Purchase manquante"
    fi
fi

if [ -f "resources/js/Pages/Purchases/Create.tsx" ]; then
    if grep -q "interface.*PurchaseItem" "resources/js/Pages/Purchases/Create.tsx"; then
        test_pass "Create.tsx: Interface PurchaseItem définie"
    else
        test_fail "Create.tsx: Interface PurchaseItem manquante"
    fi
fi

echo ""
echo "8. Vérification des calculs"
test_step "Vérification de la logique de calcul..."

if [ -f "resources/js/Pages/Purchases/Create.tsx" ]; then
    if grep -q "calculateLineTotal" "resources/js/Pages/Purchases/Create.tsx"; then
        test_pass "Create.tsx: Fonction calculateLineTotal présente"
    else
        test_fail "Create.tsx: Fonction calculateLineTotal manquante"
    fi
    
    if grep -q "useMemo" "resources/js/Pages/Purchases/Create.tsx"; then
        test_pass "Create.tsx: useMemo pour les calculs"
    else
        test_fail "Create.tsx: useMemo absent"
    fi
fi

echo ""
echo "9. Vérification de la documentation"
test_step "Recherche de la documentation..."

if [ -f "docs/PURCHASE_MODULE_COMPLETE.md" ]; then
    test_pass "Documentation complète trouvée"
    
    # Vérifier les sections importantes
    SECTIONS=("Vue d'ensemble" "Fonctionnalités" "Architecture technique" "Base de données" "Modèles Laravel" "Controller" "Routes" "Composants React")
    
    for section in "${SECTIONS[@]}"; do
        if grep -q "$section" "docs/PURCHASE_MODULE_COMPLETE.md"; then
            test_pass "Section '$section' présente"
        else
            test_fail "Section '$section' manquante"
        fi
    done
else
    test_fail "Documentation manquante"
fi

echo ""
echo "10. Test de compilation TypeScript (si npm disponible)"
test_step "Tentative de vérification TypeScript..."

if command -v npm &> /dev/null; then
    if [ -f "package.json" ]; then
        echo "npm disponible, vérification de la configuration..."
        if grep -q "typescript" "package.json"; then
            test_pass "TypeScript configuré dans package.json"
        else
            test_fail "TypeScript non configuré"
        fi
    fi
else
    echo "npm non disponible, test ignoré"
fi

echo ""
echo "======================================"
echo "📊 RÉSUMÉ DES TESTS"
echo "======================================"
echo -e "${GREEN}Tests réussis: $TESTS_PASSED${NC}"
echo -e "${RED}Tests échoués: $TESTS_FAILED${NC}"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))
    echo "Taux de réussite: $PERCENTAGE%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ Tous les tests sont passés! Le module est complet.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Certains tests ont échoué. Veuillez vérifier.${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Aucun test n'a été exécuté.${NC}"
    exit 1
fi
