<?php

namespace App\Policies;

use App\Models\Subcategory;
use App\Models\User;

class SubcategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Subcategory $subcategory): bool
    {
        return $user->id === $subcategory->category->shop->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Subcategory $subcategory): bool
    {
        return $user->id === $subcategory->category->shop->user_id;
    }

    public function delete(User $user, Subcategory $subcategory): bool
    {
        return $user->id === $subcategory->category->shop->user_id;
    }

    public function restore(User $user, Subcategory $subcategory): bool
    {
        return $user->id === $subcategory->category->shop->user_id;
    }

    public function forceDelete(User $user, Subcategory $subcategory): bool
    {
        return $user->id === $subcategory->category->shop->user_id;
    }
}
