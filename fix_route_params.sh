#!/bin/bash

# Script pour corriger les appels route() avec des paramètres incorrects

echo "🔧 Correction des appels route() avec paramètres..."
echo ""

# Fonction pour corriger un fichier
fix_route_params() {
    local file="$1"
    echo "📝 Correction: $file"
    
    # Patterns à corriger (format: route('name', id) → route('name', { param: id }))
    
    # customers
    sed -i '' "s/route('customers\.destroy', customer\.id)/route('customers.destroy', { customer: customer.id })/g" "$file"
    sed -i '' "s/route('customers\.edit', customer\.id)/route('customers.edit', { customer: customer.id })/g" "$file"
    sed -i '' "s/route('customers\.update', customer\.id)/route('customers.update', { customer: customer.id })/g" "$file"
    sed -i '' "s/route('customers\.show', customer\.id)/route('customers.show', { customer: customer.id })/g" "$file"
    
    # subcategories
    sed -i '' "s/route('subcategories\.destroy', id)/route('subcategories.destroy', { subcategory: id })/g" "$file"
    sed -i '' "s/route('subcategories\.edit', subcategory\.id)/route('subcategories.edit', { subcategory: subcategory.id })/g" "$file"
    sed -i '' "s/route('subcategories\.update', subcategory\.id)/route('subcategories.update', { subcategory: subcategory.id })/g" "$file"
    
    # products
    sed -i '' "s/route('products\.destroy', id)/route('products.destroy', { product: id })/g" "$file"
    sed -i '' "s/route('products\.edit', product\.id)/route('products.edit', { product: product.id })/g" "$file"
    sed -i '' "s/route('products\.update', product\.id)/route('products.update', { product: product.id })/g" "$file"
    sed -i '' "s/route('products\.show', product\.id)/route('products.show', { product: product.id })/g" "$file"
    
    # suppliers
    sed -i '' "s/route('suppliers\.destroy', supplier\.id)/route('suppliers.destroy', { supplier: supplier.id })/g" "$file"
    sed -i '' "s/route('suppliers\.edit', supplier\.id)/route('suppliers.edit', { supplier: supplier.id })/g" "$file"
    sed -i '' "s/route('suppliers\.update', supplier\.id)/route('suppliers.update', { supplier: supplier.id })/g" "$file"
    sed -i '' "s/route('suppliers\.show', supplier\.id)/route('suppliers.show', { supplier: supplier.id })/g" "$file"
    
    # sales
    sed -i '' "s/route('sales\.destroy', sale\.id)/route('sales.destroy', { sale: sale.id })/g" "$file"
    sed -i '' "s/route('sales\.edit', sale\.id)/route('sales.edit', { sale: sale.id })/g" "$file"
    sed -i '' "s/route('sales\.update', sale\.id)/route('sales.update', { sale: sale.id })/g" "$file"
    sed -i '' "s/route('sales\.show', sale\.id)/route('sales.show', { sale: sale.id })/g" "$file"
    
    # invoices
    sed -i '' "s/route('invoices\.destroy', invoice\.id)/route('invoices.destroy', { invoice: invoice.id })/g" "$file"
    sed -i '' "s/route('invoices\.edit', invoice\.id)/route('invoices.edit', { invoice: invoice.id })/g" "$file"
    sed -i '' "s/route('invoices\.update', invoice\.id)/route('invoices.update', { invoice: invoice.id })/g" "$file"
    sed -i '' "s/route('invoices\.show', invoice\.id)/route('invoices.show', { invoice: invoice.id })/g" "$file"
    
    # stocks
    sed -i '' "s/route('stocks\.destroy', movement\.id)/route('stocks.destroy', { stock: movement.id })/g" "$file"
    sed -i '' "s/route('stocks\.edit', movement\.id)/route('stocks.edit', { stock: movement.id })/g" "$file"
    sed -i '' "s/route('stocks\.show', movement\.id)/route('stocks.show', { stock: movement.id })/g" "$file"
    
    # shops
    sed -i '' "s/route('shops\.update', shop\.id)/route('shops.update', { shop: shop.id })/g" "$file"
    sed -i '' "s/route('shops\.edit', shop\.id)/route('shops.edit', { shop: shop.id })/g" "$file"
    sed -i '' "s/route('shops\.show', shop\.id)/route('shops.show', { shop: shop.id })/g" "$file"
    
    # inventory
    sed -i '' "s/route('inventory\.destroy', inventory\.id)/route('inventory.destroy', { inventory: inventory.id })/g" "$file"
    sed -i '' "s/route('inventory\.complete', inventory\.id)/route('inventory.complete', { inventory: inventory.id })/g" "$file"
    sed -i '' "s/route('inventory\.edit', inventory\.id)/route('inventory.edit', { inventory: inventory.id })/g" "$file"
    sed -i '' "s/route('inventory\.show', inventory\.id)/route('inventory.show', { inventory: inventory.id })/g" "$file"
    
    # users
    sed -i '' "s/route('users\.destroy', userToDelete\.id)/route('users.destroy', { user: userToDelete.id })/g" "$file"
    sed -i '' "s/route('users\.destroy', user\.id)/route('users.destroy', { user: user.id })/g" "$file"
    sed -i '' "s/route('users\.edit', user\.id)/route('users.edit', { user: user.id })/g" "$file"
    sed -i '' "s/route('users\.update', user\.id)/route('users.update', { user: user.id })/g" "$file"
    
    # categories
    sed -i '' "s/route('categories\.destroy', id)/route('categories.destroy', { category: id })/g" "$file"
    sed -i '' "s/route('categories\.edit', category\.id)/route('categories.edit', { category: category.id })/g" "$file"
    sed -i '' "s/route('categories\.update', category\.id)/route('categories.update', { category: category.id })/g" "$file"
    
    echo "   ✅ Paramètres corrigés"
}

# Liste des fichiers à corriger
FILES=(
    "resources/js/Pages/Customers/Index.tsx"
    "resources/js/Pages/Customers/Edit.tsx"
    "resources/js/Pages/Subcategories/Index.tsx"
    "resources/js/Pages/Subcategories/Edit.tsx"
    "resources/js/Pages/Products/Index.tsx"
    "resources/js/Pages/Products/Edit.tsx"
    "resources/js/Pages/Suppliers/Index.tsx"
    "resources/js/Pages/Suppliers/Show.tsx"
    "resources/js/Pages/Suppliers/Edit.tsx"
    "resources/js/Pages/Sales/Index.tsx"
    "resources/js/Pages/Invoices/Index.tsx"
    "resources/js/Pages/Invoices/Edit.tsx"
    "resources/js/Pages/Stocks/Index.tsx"
    "resources/js/Pages/Shops/Edit.tsx"
    "resources/js/Pages/Inventory/Index.tsx"
    "resources/js/Pages/Users/Index.tsx"
    "resources/js/Pages/Users/Edit.tsx"
    "resources/js/Pages/Categories/Index.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        fix_route_params "$file"
    else
        echo "⚠️  Fichier introuvable: $file"
    fi
done

echo ""
echo "✅ Correction terminée!"
echo ""
echo "🔍 Vérification des appels restants..."
grep -rn "route('.*'," resources/js/Pages --include="*.tsx" | grep -v "{ " | grep -v "route('" | head -10
