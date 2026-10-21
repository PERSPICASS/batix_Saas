#!/bin/bash

# Script pour corriger les noms de paramètres Ziggy dans tous les fichiers Pages
# Les paramètres doivent correspondre aux URI des routes (pas aux noms des routes)

echo "🔧 Correction des paramètres Ziggy..."
echo ""

# Correspondances: { ancien_param: nouveau_param }
# shops → boutique
# products → produit
# sales → vente
# invoices → facture
# customers → client
# subcategories → sous_category

FILES=$(find resources/js/Pages -name "*.tsx" -type f)

for file in $FILES; do
    echo "📝 Traitement: $file"
    
    # Shops → boutique
    sed -i '' 's/{ shop: /{ boutique: /g' "$file"
    sed -i '' 's/{shop: /{boutique: /g' "$file"
    
    # Products → produit
    sed -i '' 's/{ product: /{ produit: /g' "$file"
    sed -i '' 's/{product: /{produit: /g' "$file"
    
    # Sales → vente
    sed -i '' 's/{ sale: /{ vente: /g' "$file"
    sed -i '' 's/{sale: /{vente: /g' "$file"
    
    # Invoices → facture
    sed -i '' 's/{ invoice: /{ facture: /g' "$file"
    sed -i '' 's/{invoice: /{facture: /g' "$file"
    
    # Customers → client
    sed -i '' 's/{ customer: /{ client: /g' "$file"
    sed -i '' 's/{customer: /{client: /g' "$file"
    
    # Subcategories → sous_category
    sed -i '' 's/{ subcategory: /{ sous_category: /g' "$file"
    sed -i '' 's/{subcategory: /{sous_category: /g' "$file"
    
    # Les suivants sont déjà corrects:
    # category → category
    # inventory → inventory
    # stock → stock
    # supplier → supplier
    # user → user
done

echo ""
echo "✅ Correction terminée!"
echo ""
echo "📋 Mapping des paramètres Ziggy:"
echo "   shops.*         → { boutique: id }"
echo "   products.*      → { produit: id }"
echo "   sales.*         → { vente: id }"
echo "   invoices.*      → { facture: id }"
echo "   customers.*     → { client: id }"
echo "   subcategories.* → { sous_category: id }"
echo "   categories.*    → { category: id }"
echo "   inventory.*     → { inventory: id }"
echo "   stocks.*        → { stock: id }"
echo "   suppliers.*     → { supplier: id }"
echo "   users.*         → { user: id }"
