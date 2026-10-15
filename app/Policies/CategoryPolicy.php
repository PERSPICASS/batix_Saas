<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

/**
 * Global categories (shop_id NULL) are visible to all and managed by nobody but
 * the platform; per-shop ones belong to the accounts that can access the shop.
 * See Category.
 */
class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Category $category): bool
    {
        return $category->isVisibleTo($user);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Category $category): bool
    {
        return $category->isManagedBy($user);
    }

    public function delete(User $user, Category $category): bool
    {
        return $category->isManagedBy($user);
    }

    public function restore(User $user, Category $category): bool
    {
        return $category->isManagedBy($user);
    }

    public function forceDelete(User $user, Category $category): bool
    {
        return $category->isManagedBy($user);
    }
}
