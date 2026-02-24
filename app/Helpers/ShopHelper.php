<?php

use App\Models\Shop;

if (!function_exists('get_shop_settings')) {
    /**
     * Get the current shop settings for the authenticated user
     */
    function get_shop_settings(): ?Shop
    {
        $user = auth()->user();
        
        if (!$user) {
            return null;
        }

        // Pour super_admin, récupérer la première boutique
        if ($user->role === 'super_admin') {
            return $user->shops()->first();
        }

        // Pour les autres utilisateurs, utiliser la boutique associée
        return $user->shop;
    }
}

if (!function_exists('format_currency')) {
    /**
     * Format a number as currency using shop settings
     */
    function format_currency(float $amount, ?string $currency = null): string
    {
        $shop = get_shop_settings();
        $currencyCode = $currency ?? $shop?->currency ?? 'USD';
        
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'XOF' => 'CFA',
        ];

        $symbol = $symbols[$currencyCode] ?? $currencyCode;
        $formattedAmount = number_format($amount, 2, ',', ' ');

        // Pour XOF et CFA, le symbole va après le montant
        if (in_array($currencyCode, ['XOF', 'CFA'])) {
            return $formattedAmount . ' ' . $symbol;
        }

        // Pour USD et EUR, le symbole va avant
        return $symbol . ' ' . $formattedAmount;
    }
}

if (!function_exists('calculate_tax')) {
    /**
     * Calculate tax amount for a given price
     */
    function calculate_tax(float $price, ?float $taxRate = null): float
    {
        $shop = get_shop_settings();
        $rate = $taxRate ?? $shop?->default_tax_rate ?? 0;
        
        return $price * ($rate / 100);
    }
}

if (!function_exists('price_with_tax')) {
    /**
     * Calculate price including tax
     */
    function price_with_tax(float $price, ?float $taxRate = null): float
    {
        return $price + calculate_tax($price, $taxRate);
    }
}

if (!function_exists('get_currency_symbol')) {
    /**
     * Get currency symbol for shop
     */
    function get_currency_symbol(?string $currency = null): string
    {
        $shop = get_shop_settings();
        $currencyCode = $currency ?? $shop?->currency ?? 'USD';
        
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'XOF' => 'CFA',
        ];

        return $symbols[$currencyCode] ?? $currencyCode;
    }
}

if (!function_exists('get_active_shop')) {
    /**
     * Get the currently active shop from session
     */
    function get_active_shop(): ?Shop
    {
        $shopId = session('active_shop_id');
        
        if (!$shopId || !auth()->check()) {
            return null;
        }
        
        return auth()->user()->accessibleShops()->find($shopId);
    }
}

if (!function_exists('get_active_shop_id')) {
    /**
     * Get the currently active shop ID from session
     */
    function get_active_shop_id(): ?int
    {
        return session('active_shop_id');
    }
}
