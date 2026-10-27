import { describe, expect, it } from 'vitest';
import { formatQuantity, isDivisibleUnit, parseQuantity, roundQuantity } from '@/utils/quantity';

/**
 * The browser-side twin of App\Support\Unit. The POS read quantities with parseInt, which
 * turned 1,5 m of ribbon into 1 m without a word.
 */
describe('parseQuantity', () => {
    it('reads a French comma as well as a dot', () => {
        expect(parseQuantity('1,5')).toBe(1.5);
        expect(parseQuantity('2.25')).toBe(2.25);
    });

    it('rounds past three decimals', () => {
        expect(parseQuantity('1,23456')).toBe(1.235);
    });

    it('gives null for what is not yet a number', () => {
        expect(parseQuantity('')).toBeNull();
        expect(parseQuantity(',')).toBeNull();
        expect(parseQuantity('abc')).toBeNull();
    });

    it('keeps a value typed half-way, like "2,"', () => {
        expect(parseQuantity('2,')).toBe(2);
    });
});

describe('roundQuantity', () => {
    it('removes float noise', () => {
        expect(roundQuantity(0.1 + 0.2)).toBe(0.3);
    });
});

describe('isDivisibleUnit', () => {
    it('lets weights, volumes and lengths be split, not pieces', () => {
        expect(isDivisibleUnit('kg')).toBe(true);
        expect(isDivisibleUnit('m2')).toBe(true);
        expect(isDivisibleUnit('piece')).toBe(false);
        expect(isDivisibleUnit('bag')).toBe(false);
        expect(isDivisibleUnit(null)).toBe(false);
    });
});

describe('formatQuantity', () => {
    it('shows the measuring unit and no useless zeros', () => {
        expect(formatQuantity(2.5, 'kg')).toBe('2,5 kg');
        expect(formatQuantity('3.000', 'm2')).toBe('3 m²');
    });

    it('shows a counted quantity bare', () => {
        expect(formatQuantity(12, 'piece')).toBe('12');
    });

    it('follows the English locale', () => {
        expect(formatQuantity(2.5, 'l', 'en')).toBe('2.5 L');
    });
});
