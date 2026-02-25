<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /**
     * Vérifie si l'utilisateur a accès au produit via sa boutique
     */
    private function hasAccessToProduct(User $user, Product $product): bool
    {
        // Vérifier que le produit a un shop_id
        if (!$product->shop_id) {
            return false;
        }
        
        // Utiliser accessibleShopsQuery pour vérifier l'accès
        // Cela gère automatiquement les super_admins et les employés
        return $user->accessibleShopsQuery()
            ->where('id', $product->shop_id)
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Product $product): bool
    {
        return $this->hasAccessToProduct($user, $product);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Product $product): bool
    {
        return $this->hasAccessToProduct($user, $product);
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->hasAccessToProduct($user, $product);
    }

    public function restore(User $user, Product $product): bool
    {
        return $this->hasAccessToProduct($user, $product);
    }

    public function forceDelete(User $user, Product $product): bool
    {
        return $this->hasAccessToProduct($user, $product);
    }
}
