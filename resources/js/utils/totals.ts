/**
 * Les totaux d'un document, calculés comme le serveur les calcule.
 *
 * Le pendant exact d'App\Support\GlobalDiscount et d'Invoice::calculateTotals. Les deux
 * écrans de facture divergeaient : celui de création affichait un total sans aucune TVA,
 * celui de modification l'ajoutait puis retranchait la remise du TTC. Aucun des deux ne
 * correspondait à ce qui était enregistré.
 */

export interface TotalsLine {
    quantity: number | string;
    unit_price: number | string;
    tax_rate?: number | string | null;
}

export interface DocumentTotals {
    /** Base HT, avant remise. */
    subtotal: number;
    /** Remise réellement appliquée, bornée à la base. */
    discount: number;
    /** TVA sur la base remisée. */
    tax: number;
    total: number;
}

/**
 * Une remise accordée sur l'ensemble du document réduit la base imposable, elle ne se
 * retranche pas du TTC après coup. Elle est répartie au prorata, donc le résultat reste
 * juste quand plusieurs taux coexistent.
 */
export function documentTotals(lines: TotalsLine[], rawDiscount: number | string): DocumentTotals {
    let subtotal = 0;
    let grossTax = 0;

    for (const line of lines) {
        const quantity = Number(line.quantity) || 0;
        const unitPrice = Number(line.unit_price) || 0;
        const rate = Number(line.tax_rate) || 0;

        const lineTotal = Math.max(quantity * unitPrice, 0);
        subtotal += lineTotal;
        grossTax += (lineTotal * rate) / 100;
    }

    // Bornée à la base : une remise supérieure produirait un total négatif, donc une taxe
    // négative une fois la base réduite.
    const discount = Math.min(Math.max(Number(rawDiscount) || 0, 0), subtotal);
    const ratio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;

    const tax = round(grossTax * ratio);

    return {
        subtotal: round(subtotal),
        discount: round(discount),
        tax,
        total: round(subtotal - discount + tax),
    };
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}
