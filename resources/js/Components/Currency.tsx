import { usePage } from '@inertiajs/react';
import { PageProps, ShopSettings } from '@/types';

interface CurrencyProps {
    amount: number;
    className?: string;
}

export default function Currency({ amount, className = '' }: CurrencyProps) {
    const { shopSettings } = usePage<PageProps>().props;
    
    const formatAmount = (value: number): string => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const currency = shopSettings?.currency || 'USD';
    const symbol = shopSettings?.currency_symbol || '$';
    const formattedAmount = formatAmount(amount);

    // Pour XOF et CFA, le symbole va après le montant
    if (currency === 'XOF') {
        return <span className={className}>{formattedAmount} {symbol}</span>;
    }

    // Pour USD et EUR, le symbole va avant
    return <span className={className}>{symbol} {formattedAmount}</span>;
}

// Hook personnalisé pour accéder aux paramètres de la boutique
export function useShopSettings() {
    const { shopSettings } = usePage<PageProps>().props;
    
    return {
        currency: shopSettings?.currency || 'USD',
        currencySymbol: shopSettings?.currency_symbol || '$',
        defaultTaxRate: shopSettings?.default_tax_rate || 0,
        invoicePrefix: shopSettings?.invoice_prefix || 'INV',
        
        formatCurrency: (amount: number): string => {
            const formattedAmount = new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);

            const currency = shopSettings?.currency || 'USD';
            const symbol = shopSettings?.currency_symbol || '$';

            if (currency === 'XOF') {
                return `${formattedAmount} ${symbol}`;
            }

            return `${symbol} ${formattedAmount}`;
        },

        calculateTax: (price: number, customRate?: number): number => {
            const rate = customRate ?? shopSettings?.default_tax_rate ?? 0;
            return price * (rate / 100);
        },

        priceWithTax: (price: number, customRate?: number): number => {
            const rate = customRate ?? shopSettings?.default_tax_rate ?? 0;
            return price + (price * (rate / 100));
        },
    };
}
