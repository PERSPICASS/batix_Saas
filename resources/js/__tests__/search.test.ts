import { describe, expect, it } from 'vitest';
import { matchesSearch } from '@/utils/search';

/**
 * La recherche de produits était un `toLowerCase().includes()` sur la chaîne entière :
 * insensible à la casse, mais pas aux accents, et un seul bloc — « ciment 45 » ne
 * trouvait pas « Ciment CPJ 45 ».
 */
describe('matchesSearch', () => {
    it('ignores case', () => {
        expect(matchesSearch('bruleur', ['BRULEUR A GAZ'])).toBe(true);
        expect(matchesSearch('BRULEUR', ['Brûleur à gaz'])).toBe(true);
    });

    it('ignores accents on both sides', () => {
        expect(matchesSearch('electrique', ['Pistolet électrique 600W'])).toBe(true);
        expect(matchesSearch('élèctrique', ['PISTOLET ELECTRIQUE'])).toBe(true);
    });

    it('finds words that are not next to each other, in any order', () => {
        expect(matchesSearch('ciment 45', ['Ciment CPJ 45'])).toBe(true);
        expect(matchesSearch('45 ciment', ['Ciment CPJ 45'])).toBe(true);
    });

    it('lets each word match a different field', () => {
        expect(matchesSearch('pistolet tolsen', ['Pistolet à peinture', 'TOL-600', 'Tolsen'])).toBe(true);
    });

    it('requires every word', () => {
        expect(matchesSearch('ciment 50', ['Ciment CPJ 45'])).toBe(false);
    });

    it('matches everything on an empty search and skips missing fields', () => {
        expect(matchesSearch('   ', ['Brouette'])).toBe(true);
        expect(matchesSearch('br', ['Brouette', null, undefined])).toBe(true);
    });
});
