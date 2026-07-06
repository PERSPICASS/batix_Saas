export type Currency = 'USD' | 'EUR' | 'FCFA' | 'CAD';

export const currencies: Currency[] = ['USD', 'EUR', 'FCFA', 'CAD'];

export const currencyLabels: Record<Currency, string> = {
    USD: 'USD ($)',
    EUR: 'EUR (€)',
    FCFA: 'FCFA',
    CAD: 'CAD (CA$)',
};

// La vraie devise de référence stockée en base est le FCFA (XAF).
// EUR suit la parité fixe et officielle XAF/EUR (655.957, garantie par le
// Trésor français depuis 1999 — ne varie jamais). USD/CAD sont dérivés des
// taux de marché EUR/USD et USD/CAD du 6 juillet 2026 (1 EUR = 1.1424 USD,
// 1 USD = 1.4223 CAD) — ces deux-là fluctuent au jour le jour et devraient
// être resynchronisés périodiquement pour rester exacts.
const XAF_PER_UNIT: Record<Currency, number> = {
    FCFA: 1,
    EUR: 655.957,
    USD: 574.3,
    CAD: 403.8,
};

const SYMBOLS: Record<Currency, string> = {
    FCFA: 'FCFA',
    EUR: '€',
    USD: '$',
    CAD: 'CA$',
};

export function convertFromXaf(amountXaf: number, currency: Currency): number {
    return amountXaf / XAF_PER_UNIT[currency];
}

export function formatPrice(amountXaf: number, currency: Currency): string {
    const value = Math.round(convertFromXaf(amountXaf, currency));
    const formatted = value.toLocaleString(currency === 'FCFA' ? 'fr-FR' : 'en-US');

    if (currency === 'FCFA') return `${formatted} FCFA`;
    if (currency === 'EUR') return `${formatted}€`;
    return `${SYMBOLS[currency]}${formatted}`;
}
