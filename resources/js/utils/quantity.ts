/**
 * Le miroir de App\Support\Unit : une quantité a au plus 3 décimales, et aucune quand le
 * produit se vend à la pièce. Le serveur reste juge (QuantityForProduct) ; ici on évite
 * seulement de proposer à la caisse une saisie qu'il refusera.
 */
export const QUANTITY_PRECISION = 3;

const SYMBOLS: Record<string, string> = {
    piece: '',
    box: '',
    bag: '',
    pack: '',
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'mL',
    m: 'm',
    m2: 'm²',
    m3: 'm³',
};

/** Les codes proposés par le formulaire produit, dans l'ordre d'affichage. */
export const UNIT_CODES = Object.keys(SYMBOLS);

const DIVISIBLE = new Set(['kg', 'g', 'l', 'ml', 'm', 'm2', 'm3']);

export function isDivisibleUnit(unit?: string | null): boolean {
    return DIVISIBLE.has((unit ?? '').trim().toLowerCase());
}

export function roundQuantity(value: number): number {
    const factor = 10 ** QUANTITY_PRECISION;

    return Math.round(value * factor) / factor;
}

/**
 * « 1,5 » comme « 1.5 » : un clavier français tape une virgule. Rend null pour une saisie
 * vide ou illisible, et arrondit au-delà de 3 décimales.
 */
export function parseQuantity(input: string | number | null | undefined): number | null {
    if (typeof input === 'number') {
        return Number.isFinite(input) ? roundQuantity(input) : null;
    }

    const text = (input ?? '').trim().replace(/\s/g, '').replace(',', '.');

    if (text === '' || !/^-?\d*\.?\d*$/.test(text) || text === '.' || text === '-') {
        return null;
    }

    return roundQuantity(parseFloat(text));
}

/** « 2,5 kg », « 12 » : jamais de zéros inutiles, et l'unité seulement quand elle se mesure. */
export function formatQuantity(value: number | string | null | undefined, unit?: string | null, locale = 'fr'): string {
    const number = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    const formatted = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
        maximumFractionDigits: QUANTITY_PRECISION,
    }).format(Number.isFinite(number) ? number : 0);
    const symbol = SYMBOLS[(unit ?? '').trim().toLowerCase()] ?? '';

    return symbol ? `${formatted} ${symbol}` : formatted;
}
