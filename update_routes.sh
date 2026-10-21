#!/bin/bash

# Script pour mettre à jour tous les fichiers Pages pour utiliser useRoute()

FILES=(
    "resources/js/Pages/Categories/Create.tsx"
    "resources/js/Pages/Categories/Edit.tsx"
    "resources/js/Pages/Categories/Index.tsx"
    "resources/js/Pages/Customers/Create.tsx"
    "resources/js/Pages/Customers/Edit.tsx"
    "resources/js/Pages/Customers/Index.tsx"
    "resources/js/Pages/Inventory/Create.tsx"
    "resources/js/Pages/Inventory/Index.tsx"
    "resources/js/Pages/Invoices/Create.tsx"
    "resources/js/Pages/Invoices/Edit.tsx"
    "resources/js/Pages/Invoices/Index.tsx"
    "resources/js/Pages/Products/Create.tsx"
    "resources/js/Pages/Products/Edit.tsx"
    "resources/js/Pages/Products/Index.tsx"
    "resources/js/Pages/Profile/Edit.tsx"
    "resources/js/Pages/Sales/Create.tsx"
    "resources/js/Pages/Sales/Index.tsx"
    "resources/js/Pages/Sales/Show.tsx"
    "resources/js/Pages/Settings/Index.tsx"
    "resources/js/Pages/Shops/Create.tsx"
    "resources/js/Pages/Shops/Edit.tsx"
    "resources/js/Pages/Stocks/Create.tsx"
    "resources/js/Pages/Stocks/Index.tsx"
    "resources/js/Pages/Stocks/Show.tsx"
    "resources/js/Pages/Subcategories/Create.tsx"
    "resources/js/Pages/Subcategories/Edit.tsx"
    "resources/js/Pages/Subcategories/Index.tsx"
    "resources/js/Pages/Suppliers/Create.tsx"
    "resources/js/Pages/Suppliers/Edit.tsx"
    "resources/js/Pages/Suppliers/Index.tsx"
    "resources/js/Pages/Suppliers/Show.tsx"
    "resources/js/Pages/Users/Create.tsx"
    "resources/js/Pages/Users/Edit.tsx"
    "resources/js/Pages/Users/Index.tsx"
)

echo "🔄 Mise à jour des imports pour utiliser useRoute()..."
echo ""

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Vérifier si le fichier contient route(
        if grep -q "route(" "$file"; then
            echo "📝 Traitement: $file"
            
            # 1. Ajouter l'import useRoute si pas déjà présent
            if ! grep -q "import.*useRoute.*from.*@/utils/route" "$file"; then
                # Trouver la dernière ligne d'import
                last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
                
                if [ -n "$last_import_line" ]; then
                    # Ajouter l'import après le dernier import
                    sed -i '' "${last_import_line}a\\
import { useRoute } from '@/utils/route';
" "$file"
                    echo "   ✅ Import ajouté"
                fi
            fi
            
            # 2. Ajouter const route = useRoute() au début du composant
            # Chercher la ligne export default function
            if grep -q "export default function" "$file"; then
                # Vérifier si const route = useRoute() n'existe pas déjà
                if ! grep -q "const route = useRoute()" "$file"; then
                    # Ajouter après la ligne de définition de la fonction
                    sed -i '' '/export default function.*{/a\
    const route = useRoute();\
' "$file"
                    echo "   ✅ const route = useRoute() ajouté"
                fi
            fi
            
            echo "   ℹ️  Fichier mis à jour (vérification manuelle requise pour les paramètres)"
        else
            echo "⏭️  Ignoré: $file (pas de route())"
        fi
    else
        echo "⚠️  Fichier introuvable: $file"
    fi
    echo ""
done

echo "✅ Mise à jour terminée!"
echo ""
echo "⚠️  IMPORTANT: Vérifiez manuellement que tous les appels route() utilisent"
echo "   la bonne syntaxe avec des objets pour les paramètres:"
echo "   ❌ route('shops.show', shop.id)"
echo "   ✅ route('shops.show', { shop: shop.id })"
