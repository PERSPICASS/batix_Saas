import { describe, expect, it } from 'vitest';
import { documentTotals } from '@/utils/totals';

/**
 * The browser-side twin of App\Support\GlobalDiscount and Invoice::calculateTotals. The
 * two invoice screens disagreed with each other and with the server: the create form
 * showed a total with no VAT at all, the edit form added VAT then took the discount off
 * the TTC.
 */
describe('documentTotals', () => {
    it('reduces the taxable base by the discount', () => {
        const totals = documentTotals([{ quantity: 1, unit_price: 100000, tax_rate: 18 }], 10000);

        // 18% of 90 000, not of 100 000.
        expect(totals.tax).toBe(16200);
        expect(totals.total).toBe(106200);
    });

    it('leaves the subtotal gross, before the discount', () => {
        const totals = documentTotals([{ quantity: 1, unit_price: 100000, tax_rate: 18 }], 10000);

        expect(totals.subtotal).toBe(100000);
        expect(totals.discount).toBe(10000);
    });

    it('charges no tax when there is no discount either', () => {
        const totals = documentTotals([{ quantity: 2, unit_price: 500, tax_rate: 0 }], 0);

        expect(totals.tax).toBe(0);
        expect(totals.total).toBe(1000);
    });

    it('spreads the discount across several rates', () => {
        const totals = documentTotals(
            [
                { quantity: 1, unit_price: 100000, tax_rate: 18 },
                { quantity: 1, unit_price: 100000, tax_rate: 0 },
            ],
            20000,
        );

        expect(totals.tax).toBe(16200);
        expect(totals.total).toBe(196200);
    });

    it('caps a discount larger than the document', () => {
        const totals = documentTotals([{ quantity: 1, unit_price: 100000, tax_rate: 18 }], 500000);

        expect(totals.discount).toBe(100000);
        expect(totals.tax).toBe(0);
        expect(totals.total).toBe(0);
    });

    /** Forms hand over strings, and an empty field is not a number. */
    it('copes with the strings a form produces', () => {
        const totals = documentTotals([{ quantity: '2', unit_price: '1500', tax_rate: '18' }], '');

        expect(totals.subtotal).toBe(3000);
        expect(totals.tax).toBe(540);
        expect(totals.total).toBe(3540);
    });

    it('ignores a line with no rate at all', () => {
        const totals = documentTotals([{ quantity: 1, unit_price: 1000 }], 0);

        expect(totals.tax).toBe(0);
        expect(totals.total).toBe(1000);
    });
});
