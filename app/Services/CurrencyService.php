<?php

namespace App\Services;

class CurrencyService
{
    private static array $exchangeRates = [
        'FCFA' => 1,
        'USD' => 0.0017,
        'EUR' => 0.0015,
        'XOF' => 1, // Same as FCFA
        'CAD' => 0.0023,
        'GBP' => 0.0013,
    ];

    private static array $symbols = [
        'FCFA' => 'F',
        'USD' => '$',
        'EUR' => '€',
        'XOF' => 'F',
        'CAD' => 'C$',
        'GBP' => '£',
    ];

    public static function convert(float $amount, string $fromCurrency = 'FCFA', string $toCurrency = 'FCFA'): float
    {
        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        // Convert to base currency (FCFA) first
        $rate = self::$exchangeRates[$fromCurrency] ?? 1;
        $inFcfa = $amount / $rate;

        // Convert from FCFA to target currency
        $targetRate = self::$exchangeRates[$toCurrency] ?? 1;
        return $inFcfa * $targetRate;
    }

    public static function format(float $amount, string $currency = 'FCFA', int $decimals = 0): string
    {
        $symbol = self::$symbols[$currency] ?? $currency;

        if ($decimals === 0) {
            return number_format($amount, 0, ',', ' ') . ' ' . $symbol;
        }

        return number_format($amount, $decimals, ',', ' ') . ' ' . $symbol;
    }

    public static function getAvailableCurrencies(): array
    {
        return array_keys(self::$exchangeRates);
    }

    public static function getExchangeRate(string $fromCurrency = 'FCFA', string $toCurrency = 'FCFA'): float
    {
        if ($fromCurrency === $toCurrency) {
            return 1;
        }

        $rate = self::$exchangeRates[$fromCurrency] ?? 1;
        $targetRate = self::$exchangeRates[$toCurrency] ?? 1;

        return $targetRate / $rate;
    }

    public static function updateExchangeRate(string $currency, float $rate): void
    {
        if (array_key_exists($currency, self::$exchangeRates)) {
            self::$exchangeRates[$currency] = $rate;
        }
    }
}
