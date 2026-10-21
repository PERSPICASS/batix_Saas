<?php

if (!function_exists('user_route')) {
    /**
     * Generate a URL with code_user and shop_slug parameters
     *
     * @param string $name Route name
     * @param array $parameters Additional route parameters
     * @param bool $absolute Generate absolute URL
     * @return string
     */
    function user_route(string $name, array $parameters = [], bool $absolute = true): string
    {
        $user = auth()->user();
        
        if (!$user) {
            return route('login');
        }
        
        $shop = session('active_shop_id') 
            ? $user->accessibleShopsQuery()->where('id', session('active_shop_id'))->first()
            : $user->accessibleShopsQuery()->first();
        
        if (!$shop) {
            return route('login');
        }
        
        // Merge code_user and shop_slug with additional parameters
        $routeParameters = array_merge([
            'code_user' => $user->code_user,
            'shop_slug' => $shop->slug,
        ], $parameters);
        
        return route($name, $routeParameters, $absolute);
    }
}

if (!function_exists('current_shop')) {
    /**
     * Get the current active shop
     *
     * @return \App\Models\Shop|null
     */
    function current_shop()
    {
        $user = auth()->user();
        
        if (!$user) {
            return null;
        }
        
        $shopId = session('active_shop_id');
        
        if ($shopId) {
            return $user->accessibleShopsQuery()->where('id', $shopId)->first();
        }
        
        return $user->accessibleShopsQuery()->first();
    }
}

if (!function_exists('user_code')) {
    /**
     * Get the current user's code_user
     *
     * @return string|null
     */
    function user_code()
    {
        return auth()->user()?->code_user;
    }
}

if (!function_exists('shop_slug')) {
    /**
     * Get the current shop's slug
     *
     * @return string|null
     */
    function shop_slug()
    {
        return current_shop()?->slug;
    }
}

if (!function_exists('should_log_activity')) {
    /**
     * Determine if activities should be logged
     *
     * @return bool
     */
    function should_log_activity(): bool
    {
        // Don't log during console commands (migrations, seeders, etc.)
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return false;
        }

        // Don't log if user is not authenticated
        if (!auth()->check()) {
            return false;
        }

        return true;
    }
}
