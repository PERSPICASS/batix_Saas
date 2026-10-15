<?php

namespace App\Policies;

use App\Models\Subcategory;
use App\Models\User;

/**
 * A subcategory follows its category: visible when the category is, managed
 * only when the category belongs to one of the user's shops. See Category.
 */
class SubcategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Subcategory $subcategory): bool
    {
        return $subcategory->category->isVisibleTo($user);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Subcategory $subcategory): bool
    {
        return $subcategory->category->isManagedBy($user);
    }

    public function delete(User $user, Subcategory $subcategory): bool
    {
        return $subcategory->category->isManagedBy($user);
    }

    public function restore(User $user, Subcategory $subcategory): bool
    {
        return $subcategory->category->isManagedBy($user);
    }

    public function forceDelete(User $user, Subcategory $subcategory): bool
    {
        return $subcategory->category->isManagedBy($user);
    }
}
