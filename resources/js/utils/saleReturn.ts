/**
 * Montant à rembourser pour un retour, calculé comme le serveur le fera.
 *
 * Le pendant de ReturnsController::recalculateSaleAmounts : chaque article retourné fait
 * baisser le sous-total, la TVA et la remise gardent leur proportion, et on rembourse ce
 * dont le total a baissé. Les articles partent un par un (un appel par ligne), donc on
 * rejoue la même suite d'étapes, avec les mêmes arrondis que la base (2 décimales).
 */

export interface SaleAmounts {
    subtotal: number | string;
    tax_amount: number | string;
    discount_amount: number | string;
    total: number | string;
}

export interface ReturnedLine {
    unit_price: number | string;
    quantity: number;
}

export function refundPreview(sale: SaleAmounts, lines: ReturnedLine[]): number {
    let subtotal = Number(sale.subtotal) || 0;
    let tax = Number(sale.tax_amount) || 0;
    let discount = Number(sale.discount_amount) || 0;
    let total = Number(sale.total) || 0;
    let refund = 0;

    for (const line of lines) {
        const taxRate = subtotal > 0 ? tax / subtotal : 0;
        const discountRate = subtotal > 0 ? discount / subtotal : 0;

        const newSubtotal = Math.max(subtotal - (Number(line.unit_price) || 0) * line.quantity, 0);
        const newTax = round(newSubtotal * taxRate);
        const newDiscount = round(newSubtotal * discountRate);
        const newTotal = round(Math.max(0, newSubtotal + newSubtotal * taxRate - newSubtotal * discountRate));

        refund += round(total - newTotal);
        [subtotal, tax, discount, total] = [round(newSubtotal), newTax, newDiscount, newTotal];
    }

    return round(refund);
}

/** La remise de la vente, en pourcentage de son sous-total (0 sans remise). */
export function discountPercent(sale: SaleAmounts): number {
    const subtotal = Number(sale.subtotal) || 0;

    return subtotal > 0 ? Math.round(((Number(sale.discount_amount) || 0) / subtotal) * 1000) / 10 : 0;
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}
