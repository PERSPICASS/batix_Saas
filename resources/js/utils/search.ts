/**
 * Recherche tolérante pour les listes filtrées dans le navigateur (caisse, lignes de
 * facture, devis, achats…), alignée sur celle du serveur (App\Support\TextSearch) :
 *
 * - casse et accents ignorés : « bruleur » trouve « BRÛLEUR », « electrique » trouve
 *   « Électrique » ;
 * - chaque mot tapé doit se retrouver quelque part, dans n'importe quel ordre et dans
 *   n'importe lequel des champs : « ciment 45 » trouve « Ciment CPJ 45 ».
 */
export function normalizeSearch(text: string | null | undefined): string {
    return (text ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

export function matchesSearch(query: string, fields: Array<string | null | undefined>): boolean {
    const words = normalizeSearch(query).split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return true;
    }

    const haystack = fields.map(normalizeSearch).join(' ');

    return words.every((word) => haystack.includes(word));
}
