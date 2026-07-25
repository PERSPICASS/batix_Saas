import { describe, expect, it } from 'vitest';
import { toWhatsAppNumber } from '@/Components/WhatsAppShareButton';

/**
 * wa.me only accepts a bare international number — no `+`, no spaces, no separators.
 * Phones are stored as people type them, so the stored form is never usable as-is.
 */
describe('toWhatsAppNumber', () => {
    it('strips the plus sign and the spacing a phone is typed with', () => {
        expect(toWhatsAppNumber('+225 07 49 99 22 08')).toBe('2250749992208');
    });

    it('strips dots, dashes and parentheses', () => {
        expect(toWhatsAppNumber('+212 (0)6-12.34.56.78')).toBe('2120612345678');
    });

    it('leaves an already clean number alone', () => {
        expect(toWhatsAppNumber('2250749992208')).toBe('2250749992208');
    });

    it('returns an empty string when there is no digit at all', () => {
        expect(toWhatsAppNumber('à renseigner')).toBe('');
    });

    /**
     * A local number keeps its leading zero, which wa.me will not resolve. Nothing here
     * can guess the country, so the seller has to type the international form — hence the
     * placeholder showing one.
     */
    it('does not invent a country code', () => {
        expect(toWhatsAppNumber('07 49 99 22 08')).toBe('0749992208');
    });
});
