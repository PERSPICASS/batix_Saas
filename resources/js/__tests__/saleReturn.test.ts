import { describe, expect, it } from 'vitest';
import { discountPercent, refundPreview } from '@/utils/saleReturn';

/**
 * The figures are those of SaleReturnChangeTest: the cashier must see, before
 * confirming, the amount the server will refund.
 */
describe('refundPreview', () => {
    it('refunds the unit price when the sale has no discount nor VAT', () => {
        const sale = { subtotal: 8000, tax_amount: 0, discount_amount: 0, total: 8000 };

        expect(refundPreview(sale, [{ unit_price: 2000, quantity: 1 }])).toBe(2000);
    });

    it('includes the VAT', () => {
        const sale = { subtotal: 2000, tax_amount: 360, discount_amount: 0, total: 2360 };

        expect(refundPreview(sale, [{ unit_price: 1000, quantity: 1 }])).toBe(1180);
    });

    it('takes the discount off', () => {
        const sale = { subtotal: '10000.00', tax_amount: '0.00', discount_amount: '1000.00', total: '9000.00' };

        expect(refundPreview(sale, [{ unit_price: '2000.00', quantity: 1 }])).toBe(1800);
    });

    /** Several lines go out one after the other: their refunds add up to the whole sale. */
    it('adds up to the total when everything comes back', () => {
        const sale = { subtotal: 3000, tax_amount: 486, discount_amount: 300, total: 3186 };

        expect(refundPreview(sale, [
            { unit_price: 1000, quantity: 1 },
            { unit_price: 2000, quantity: 1 },
        ])).toBe(3186);
        expect(refundPreview(sale, [{ unit_price: 1000, quantity: 1 }])).toBe(1062);
    });
});

describe('discountPercent', () => {
    it('gives the discount as a share of the subtotal', () => {
        expect(discountPercent({ subtotal: 10000, tax_amount: 0, discount_amount: 1000, total: 9000 })).toBe(10);
        expect(discountPercent({ subtotal: 0, tax_amount: 0, discount_amount: 0, total: 0 })).toBe(0);
    });
});
