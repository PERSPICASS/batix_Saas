<?php

namespace App\Rules;

use App\Models\Category;
use App\Models\Subcategory;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Replaces `exists:categories,id` / `exists:subcategories,id`, which accepted
 * any tenant's category. See Category for the global vs per-shop model.
 *
 *   AccessibleCategory::visible($user)      // assign to a product
 *   AccessibleCategory::managed($user)      // add a subcategory under it
 *   AccessibleCategory::subcategory($user)  // assign a subcategory to a product
 */
class AccessibleCategory implements ValidationRule
{
    private function __construct(
        private readonly User $user,
        private readonly string $mode,
    ) {}

    public static function visible(User $user): self
    {
        return new self($user, 'visible');
    }

    public static function managed(User $user): self
    {
        return new self($user, 'managed');
    }

    public static function subcategory(User $user): self
    {
        return new self($user, 'subcategory');
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $exists = match ($this->mode) {
            'visible' => Category::visibleTo($this->user)->whereKey($value)->exists(),
            'managed' => Category::managedBy($this->user)->whereKey($value)->exists(),
            'subcategory' => Subcategory::visibleTo($this->user)->whereKey($value)->exists(),
        };

        if (! $exists) {
            $fail(__('validation.exists', ['attribute' => $attribute]));
        }
    }
}
