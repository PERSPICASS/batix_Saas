import { describe, it, expect } from 'vitest';
import { convertFromXaf, formatPrice, currencies, currencyLabels } from '@/utils/currency';

describe('convertFromXaf', () => {
    it('leaves FCFA amounts untouched', () => {
        expect(convertFromXaf(10_000, 'FCFA')).toBe(10_000);
    });

    it('converts EUR at the fixed XAF parity', () => {
        // 655.957 XAF per EUR is a pegged rate, so this figure is exact and must not drift.
        expect(convertFromXaf(655_957, 'EUR')).toBeCloseTo(1_000, 6);
    });

    it('converts USD and CAD at their configured rates', () => {
        expect(convertFromXaf(574_300, 'USD')).toBeCloseTo(1_000, 6);
        expect(convertFromXaf(403_800, 'CAD')).toBeCloseTo(1_000, 6);
    });

    it('is monotonic — a bigger XAF amount never converts to a smaller price', () => {
        for (const currency of currencies) {
            expect(convertFromXaf(2_000_000, currency)).toBeGreaterThan(convertFromXaf(1_000_000, currency));
        }
    });
});

describe('formatPrice', () => {
    it('suffixes FCFA and groups with the French convention', () => {
        const formatted = formatPrice(1_234_567, 'FCFA');

        expect(formatted).toMatch(/FCFA$/);
        // fr-FR groups with a (narrow, non-breaking) space rather than a comma.
        expect(formatted).not.toContain(',');
        expect(formatted.replace(/[\s  ]/g, '')).toBe('1234567FCFA');
    });

    it('suffixes the euro sign and groups with the English convention', () => {
        expect(formatPrice(655_957, 'EUR')).toBe('1,000€');
    });

    it('prefixes the dollar symbols', () => {
        expect(formatPrice(574_300, 'USD')).toBe('$1,000');
        expect(formatPrice(403_800, 'CAD')).toBe('CA$1,000');
    });

    it('rounds to whole units rather than truncating', () => {
        // 655.957 * 1.6 = 1049.53... XAF, which is 1.6 EUR -> rounds to 2, not down to 1.
        expect(formatPrice(Math.round(655.957 * 1.6), 'EUR')).toBe('2€');
    });

    it('formats zero without a sign or separator', () => {
        expect(formatPrice(0, 'EUR')).toBe('0€');
        expect(formatPrice(0, 'USD')).toBe('$0');
    });

    it('produces a label for every supported currency', () => {
        for (const currency of currencies) {
            expect(currencyLabels[currency]).toBeTruthy();
            expect(formatPrice(1_000_000, currency)).not.toContain('NaN');
        }
    });
});
